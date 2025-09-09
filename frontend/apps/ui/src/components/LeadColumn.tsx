import {Group} from "@mantine/core"
import {IconColumns2} from "@tabler/icons-react"
import {useCallback} from "react"

type ClickableFunc<T> = (row: T, details: boolean) => void

interface LeadColumnProps<T> {
  onClickHandler?: ClickableFunc<T>
  row: T
  children: React.ReactNode
}

const LeadColumn = <T,>({
  onClickHandler,
  row,
  children
}: LeadColumnProps<T>) => {
  // Memoize handlers to prevent recreation
  const handleDetailsClick = useCallback(
    () => onClickHandler?.(row, true),
    [onClickHandler, row]
  )
  const handleMainClick = useCallback(
    () => onClickHandler?.(row, false),
    [onClickHandler, row]
  )

  const handleMouseEnter = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.currentTarget.style.opacity = "0.6"
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.currentTarget.style.opacity = "0"
  }, [])

  return (
    <Group gap="xs">
      <IconColumns2
        size={14}
        style={{opacity: 0, cursor: "pointer"}}
        onClick={handleDetailsClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <div style={{cursor: "pointer"}} onClick={handleMainClick}>
        {children}
      </div>
    </Group>
  )
}

export default LeadColumn
