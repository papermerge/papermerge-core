import type {UseFormReturnType} from "@mantine/form"
import {useEffect} from "react"

export function useModalReset(
  opened: boolean,
  form: UseFormReturnType<any>,
  resetMutation: () => void
) {
  useEffect(() => {
    if (opened) {
      form.reset()
      resetMutation()
    }
  }, [opened])
}

// Hook to handle successful form submission
export function useSuccessHandler(
  isSuccess: boolean,
  onSuccess: () => void,
  delay: number = 1000
) {
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(onSuccess, delay)
      return () => clearTimeout(timer) // Cleanup timeout
    }
  }, [isSuccess, onSuccess, delay])
}
