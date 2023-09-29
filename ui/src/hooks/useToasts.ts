import { useContext } from "react";
import { ToastContext } from "components/toasts/ToastsProvider";


const useToast = () => {
  const toastHelpers = useContext(ToastContext);
  return toastHelpers;
}


export default useToast;
