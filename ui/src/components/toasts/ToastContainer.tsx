import { createPortal } from 'react-dom'

import ToastContainer from 'react-bootstrap/ToastContainer';
import Toast from './toast';
import type { ToastType } from "./types";


type Args = {
  toasts: Array<ToastType>;
  onClose: (id: number) => void;
}

function CustomToastContainer({toasts, onClose}: Args) {

  let new_toasts = toasts.map(item => (
    <Toast onClick={onClose} key={item.id} level={item.level} id={item.id}>{item.text}</Toast>
  ));

  return createPortal(
    <ToastContainer position='bottom-end'>
      {new_toasts}
    </ToastContainer>,
    document.body
  );
}

export default CustomToastContainer;
