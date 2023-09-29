import { useState, createContext, ReactNode } from "react";
import ToastContainer from "./ToastContainer";
import type { ToastType, ToastContextType } from "./types";


type Args = {
  children: ReactNode
}

const ToastContext = createContext<ToastContextType | null>(null);
let id = 1;


const ToastProvider = ({ children }: Args) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (text: string) => {
    let new_toasts = [...toasts, {id: id++, text}]
    setToasts(new_toasts);
  };

  const removeToast = (id: number) => {
    setToasts(toasts => toasts.filter(t => t.id !== id));
  };

  const onClose = (id: number) => {
    removeToast(id);
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      <ToastContainer toasts={toasts} onClose={onClose} />
      {children}
    </ToastContext.Provider>
  );
}


export {ToastProvider, ToastContext };
