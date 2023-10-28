

type Handler = {
  // callback to be invoked
  callback: (data: any, ev: MessageEvent) => void;
  // context for the callback
  context?: any;
};


function get_host(): string {
  return window.location.host;
}


function get_url(): string {
  if (window.location.protocol == 'https:') {
    return `wss://${get_host()}/ws/ocr`;
  }

  return `ws://${get_host()}/ws/ocr`;
}


class WebSocketService {

  _url: string;
  _socket: WebSocket;
  _handlers: Map<string, Handler>;

  constructor(url: string) {
    console.log(`Connecting to ${url}`);

    let that = this;

    this._url = url;
    this._socket = new WebSocket(this._url);
    this._handlers = new Map<string, Handler>();


    this._socket.onerror = (event: Event) => {
      console.info(`Error while connecting to WebSocket event=${event}`);
    }

    this._socket.onmessage = (event: MessageEvent) => {
      that._handlers.forEach((item: Handler) => {
        let json_data, msg;

        try {
          json_data = JSON.parse(event.data);
          console.log(`Incoming Event: ${json_data.document_id} - ${json_data.type}`);
          item.callback.apply(item.context, [json_data, event]);
        } catch (err) {
          msg = `Error ${err} while parsing incoming data: ${event.data}`;
          console.log(msg);
        }
      });
    }
  }

  addHandler(key: string, handler: Handler) {
    if (!this._socket) {
      return;
    }

    this._handlers.set(key, handler);
  }

  removeHandler(key: string) {
    console.log(`removing ${key}`);
    this._handlers.delete(key);
  }
}

const websockets = new WebSocketService(get_url());

export default websockets;
