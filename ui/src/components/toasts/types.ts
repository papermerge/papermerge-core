

export type ToastType = {
  id: number;
  text: string;
}


export type ToastContextType = {
  addToast: (text: string) => void;
  removeToast: (id: number) => void;
}
