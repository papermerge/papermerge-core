import {useEffect} from "react"

export function useEnterSubmit(callback: () => Promise<void> | void) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === "Enter") {
        callback()
      }
    }

    document.addEventListener("keydown", handleKeydown)
    return () => {
      document.removeEventListener("keydown", handleKeydown)
    }
  }, [callback])
}
