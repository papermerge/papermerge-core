import { ReactNode, useEffect } from 'react';
import useToast from "hooks/useToasts";
import Toast from 'react-bootstrap/Toast';
import "./toast.scss";
import { ToastLevel, ToastBgColor } from './types';


type Args = {
  id: number;
  level: ToastLevel,
  children: ReactNode;
  onClick: (id: number) => void;
  timeout?: number;
}


function  level2bg(level: ToastLevel): ToastBgColor {
  if (level == "info") {
    return "dark";
  }

  if (level == "error") {
    return "danger";
  }

  return "dark";
}



const DEFAULT_TIMEOUT = 10000; // ms (milliseconds)


function CustomToast({id, level, children, onClick, timeout}: Args) {
  /* Toast component (user notification).

  Will auto-remove itself after `timeout` milliseconds.
  */
  let toasts = useToast();

  if (!timeout) {
    timeout = DEFAULT_TIMEOUT;
  }

  // auto-remove itself
  useEffect(() => {
    const timer = setTimeout(() => {
      toasts?.removeToast(id);
    }, timeout); // delay

    return () => {
      clearTimeout(timer);
    };
  }, [id, toasts?.removeToast]);


  return (
      <Toast bg={level2bg(level)}>
        <div className='d-flex'>
          <div className='toast-body'>
            {children}
          </div>
          <button
            onClick={() => onClick(id)}
            type="button"
            className="btn-close me-2 m-auto btn-close-white"
            data-bs-dismiss="toast" aria-label="Close" />
        </div>
      </Toast>
  );
}

export default CustomToast;
