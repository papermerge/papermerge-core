from django.utils.translation import ugettext_lazy as _
from django.views import generic
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect

from papermerge.contrib.admin.views import mixins as mix
from papermerge.contrib.admin.forms import AutomateForm
from papermerge.core.models import Automate
from papermerge.core.models.folder import get_inbox_children
from papermerge.core.models.page import get_pages


class AutomatesView(LoginRequiredMixin):
    model = Automate
    form_class = AutomateForm
    success_url = reverse_lazy('admin:automates')


class AutomatesListView(
    AutomatesView,
    mix.PaginationMixin,
    mix.DeleteEntriesMixin,
    generic.ListView
):

    title = _("Automates")

    def get_queryset(self):
        qs = super().get_queryset()

        return qs.filter(
            user=self.request.user
        ).order_by('name')

    def post(self, request):

        selected_action = request.POST.getlist('_selected_action')

        go_action = request.POST['action']

        if go_action == 'delete_selected':
            self.delete_selected_entries(selected_action)

        if go_action == 'run_selected':
            self.run_selected_automates(selected_action)

        return redirect(self.success_url)

    def run_selected_automates(self, selection):
        inbox_nodes = get_inbox_children(
            self.request.user
        )

        # Run automates over all page objects from user's inbox.
        # Only pages with non empty text field are taken into account
        self.get_queryset().filter(
            id__in=selection
        ).run(
            get_pages(
                inbox_nodes,
                include_pages_with_empty_text=False
            )
        )


class AutomateCreateView(AutomatesView, generic.CreateView):

    def get_form_kwargs(self):
        """Return the keyword arguments for instantiating the form."""
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user

        return kwargs

    def get_context_data(self, **kwargs):

        context = super().get_context_data(**kwargs)
        context['title'] = _('New')
        context['action_url'] = reverse_lazy('admin:automate-add')

        return context

    def form_valid(self, form):
        form.instance.user = self.request.user

        return super().form_valid(form)


class AutomateUpdateView(AutomatesView, generic.UpdateView):

    def get_context_data(self, **kwargs):

        context = super().get_context_data(**kwargs)
        context['title'] = _('Edit')
        context['action_url'] = reverse_lazy(
            'admin:automate-update',
            args=(self.object.pk,)
        )

        return context
