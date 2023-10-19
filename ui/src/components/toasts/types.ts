

export type ToastType = {
  id: number;
  text: string;
  level: ToastLevel;
}


export type ToastContextType = {
  addToast: (level: ToastLevel, text: string) => void;
  removeToast: (id: number) => void;
}


export type ToastBgColor = "dark" | "danger";
export type ToastLevel = "info" | "error";
