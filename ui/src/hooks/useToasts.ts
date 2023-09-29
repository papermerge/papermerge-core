import { useContext } from "react";
import { ToastContext } from "components/toasts/ToastsProvider";


const useToast = () => {
  /* Usage:

    let toasts = useToast();

    toasts?.addToast("Some notification message");
    toasts?.removeToast(id);
  */
  const toastHelpers = useContext(ToastContext);
  return toastHelpers;
}


export default useToast;
