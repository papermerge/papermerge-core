from asgiref.sync import async_to_sync


class RequireAuth:

    def connect(self):
        self.user = self.scope["user"]
        if self.user is None:
            return self.close()

        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        # When websocket clients sends non empty 'Sec-WebSocket-Protocol'
        # Chrome browser expects response from the server with non empty
        #  Sec-WebSocket-Protocol as well.
        # -> self.accept() sends empty Sec-WebSocket-Protocol WebSocket()
        #   function fails with an error
        # -> self.accept('access_token') send NON EMPTY Sec-WebSocket-Protocol
        #   header with value 'access_token'
        # which fixes the error in Chrome Browser
        # https://github.com/django/channels/issues/1369#issuecomment-724299511
        if 'access_token' in self.scope['subprotocols']:
            self.accept('access_token')
        else:
            self.accept()
