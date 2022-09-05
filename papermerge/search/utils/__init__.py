
def get_model_ct_tuple(model):
    # Deferred models should be identified as if they were the underlying model.
    model_name = (
        model._meta.concrete_model._meta.model_name
        if hasattr(model, "_deferred") and model._deferred
        else model._meta.model_name
    )
    return (model._meta.app_label, model_name)


def get_model_ct(model):
    return "%s.%s" % get_model_ct_tuple(model)
