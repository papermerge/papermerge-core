import {RefObject, useCallback, useEffect, useState} from "react"

const APP_SHELL_HEADER_HEIGHT_WITH_PADDING = 84

// without this number remaining height is too big -> it pushes
// pagination out of the view area. I don't know why...
const JUST_A_GUESS = 80 // this number is just a guess

export function useDynamicHeight<T extends HTMLElement>(
  refs: RefObject<T | null>[]
) {
  const [height, setHeight] = useState(0)

  const calculateHeight = useCallback(() => {
    const windowHeight = window.innerHeight
    const occupiedHeight = refs.reduce((sum, ref) => {
      return sum + (ref.current?.offsetHeight ?? 0) // null safe
    }, 0)
    const totalOccupiedHeight =
      occupiedHeight + APP_SHELL_HEADER_HEIGHT_WITH_PADDING

    setHeight(windowHeight - totalOccupiedHeight - JUST_A_GUESS)
  }, [refs])

  useEffect(() => {
    calculateHeight()
    window.addEventListener("resize", calculateHeight)
    return () => window.removeEventListener("resize", calculateHeight)
  }, [calculateHeight])

  return height
}
