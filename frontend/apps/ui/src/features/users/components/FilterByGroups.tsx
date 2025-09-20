import {Paper} from "@mantine/core"
import LazyGroupSelect from "./LazyGroupSelect"

interface Args {
  label: string
  groups?: string[]
  onChange?: (value: string[] | null) => void
}

export default function FilterByGroups({groups, onChange, label}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyGroupSelect
        label={label}
        selectedGroups={groups}
        onChange={onChange}
      />
    </Paper>
  )
}
