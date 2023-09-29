import { ReactNode, useEffect } from 'react';
import useToast from "hooks/useToasts";
import Toast from 'react-bootstrap/Toast';
import "./toast.scss";


type Args = {
  id: number;
  children: ReactNode;
  onClick: (id: number) => void;
  timeout?: number;
}


const DEFAULT_TIMEOUT = 4000; // ms (milliseconds)


function CustomToast({id, children, onClick, timeout}: Args) {
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
      <Toast bg={"dark"}>
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
