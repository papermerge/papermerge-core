import json

from django.core.exceptions import ValidationError

from django.views.generic import (
    TemplateView,
)

from papermerge.core.models import (
    BaseTreeNode,
    Folder
)
from .mixins import HybridResponseMixin


class HybridFolderListView(HybridResponseMixin, TemplateView):
    """
    1. GET folder/
    2. GET folder/<int:parent_id>/

    This is hybrid view in sense that it can handle different
    content types: text/html and application/json.

    If client asks for text/html content type, this view
    will respond by rendering as html the `self.template_name`,
    after clients loads `self.template_name` page, it will issue
    one more time GET folder/(<int:parent_id>) request, but
    this time with application/json content type.

    For application/json content type returns a list of nodes (documents and
    folders) with given `parent_id`. If `parent_id` is not provided, will
    list all root nodes (i.e documents and folders without parent) of
    authenticated user.
    """
    model = BaseTreeNode
    template_name = "admin/index.html"

    def get_queryset(self):
        parent_id = self.kwargs.get('parent_id', None)
        qs = self.model.objects.filter(
            parent_id=parent_id
        ).exclude(
            title=Folder.INBOX_NAME
        )

        return qs

    def get_context_data(self, **kwargs):
        qs = self.get_queryset()
        parent = self._get_parent_node()

        nodes_list = [
            node.to_dict()
            for node in qs.all()
        ]
        ancestors_list = []

        if parent:
            ancestors_list = [
                {'id': parent.id, 'title': parent.title}
                for item in parent.get_ancestors(include_self=True)
            ]

        context = {
            'current_nodes': nodes_list,
            'breadcrumb': ancestors_list
        }

        return context

    def render_to_response(self, context, **response_kwargs):
        if self.asks_for_json:  # provided by HybridResponseMixin
            resp = self.render_to_json_response(context, **response_kwargs)
        else:
            resp = super().render_to_response(context, **response_kwargs)

        return resp

    def _get_parent_node(self):
        parent_id = self.kwargs.get('parent_id', None)
        parent = None
        if parent_id:
            try:
                parent = self.model.objects.get(id=parent_id)
            except self.model.DoesNotExist:
                return None

        return parent


class FolderCreateView(HybridResponseMixin, TemplateView):
    """
    POST folder/add/

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
