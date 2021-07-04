import json

from django.core.exceptions import ValidationError

from django.views.generic import (
    TemplateView,
)

from papermerge.core.models import (
    BaseTreeNode,
    Folder
)
from .mixins import JSONResponseMixin


class FolderListView(JSONResponseMixin, TemplateView):
    """
    1. GET folder/
    2. GET folder/<int:parent_id>/

    In both cases returns a list of nodes (documents and folders)
    with given `parent_id`. If `parent_id` is not provided, will list
    all root nodes (i.e documents and folders without parent) of authenticated
    user.
    """
    model = BaseTreeNode

    def get_queryset(self):
        node_id = self.request.GET.get('node_id', None)

        qs = self.model.objects.filter(
            parent_id=node_id
        ).exclude(
            title=Folder.INBOX_NAME
        )

        return qs

    def get_context_data(self, **kwargs):
        qs = self.get_queryset()

        nodes_list = [
            node.to_dict()
            for node in qs.all()
        ]

        context = {
            'current_nodes': nodes_list
        }

        return context

    def render_to_response(self, context, **response_kwargs):
        resp = self.render_to_json_response(context, **response_kwargs)
        return resp


class FolderCreateView(JSONResponseMixin, TemplateView):
    """
    POST /folder/add/

    Creates a folder. POST body is expected to be
    a dictionary (i.e. json formated string) with following
    attributes:

        `title` - title of the folder to be created
        `parent_id` - the parent node of the folder

    In case `parent_id` is missing i.e. is None or it is an empty string the
    folder will be created without parent.
    """

    def post(self, request, *args, **kwargs):

        try:
            # request level validation
            clean_data = self.clean(request)
        except ValidationError as e:
            return self.render_to_json_bad_request(str(e))

        parent = clean_data['parent']
        title = clean_data['title']

        folder = Folder(
            title=title,
            parent=parent,
            user=request.user
        )

        try:
            # model level validation
            folder.full_clean()
        except ValidationError as e:
            # create human friendly error message from
            # dictionary
            error_message = " ".join([
                f"{k}: {' '.join(v)}" for k, v in e.message_dict.items()
            ])
            return self.render_to_json_bad_request(error_message)

        # and finally save object in DB!
        folder.save()

        return self.render_to_json_response({
            'folder': folder.to_dict()
        })

    def clean(self, request):
        """
        Performs validations and returnd clean data.

        In case of validation issue, will raise ValidationError
        """
        data = json.loads(request.body)
        parent_id = data.get('parent_id', None)
        title = data.get('title', False)

        if title == Folder.INBOX_NAME:
            error_message = 'This title is not allowed'
            return error_message

        if not (parent_id or title):
            error_message = 'Both parent_id and title are empty'
            raise ValidationError(error_message)

        try:
            parent_id = int(parent_id or -1)
        except ValueError:
            parent_id = -1

        if int(parent_id) < 0:
            parent_folder = None
        else:
            parent_folder = Folder.objects.filter(id=parent_id).first()
            if not parent_folder:
                error_message = f"Parent with id={parent_id} does not exist"
                raise ValidationError(error_message)

        return {
            'parent': parent_folder,
            'title': title
        }


class FolderUpdateView:
    pass


class FolderDeleteView:
    pass
