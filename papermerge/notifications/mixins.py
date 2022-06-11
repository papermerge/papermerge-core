from asgiref.sync import async_to_sync


class RequireAuth:

    def connect(self):
        self.user = self.scope["user"]
        if self.user is None:
            return self.close()

        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept('access_token')
