import {Center, Group, Table, Text, UnstyledButton} from "@mantine/core"
import {IconChevronDown, IconChevronUp, IconSelector} from "@tabler/icons-react"

import classes from "./TableSort.module.css"

interface ThProps {
  children: React.ReactNode
  reversed: boolean
  sorted: boolean
  onSort: () => void
}

export default function Th({children, reversed, sorted, onSort}: ThProps) {
  let Icon = IconSelector

  if (sorted) {
    if (reversed) {
      Icon = IconChevronUp
    } else {
      Icon = IconChevronDown
    }
  }

  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
