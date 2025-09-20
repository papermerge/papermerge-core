import {Paper} from "@mantine/core"
import LazyRoleSelect from "./LazyRoleSelect"

interface Args {
  label: string
  roles?: string[]
  onChange?: (value: string[] | null) => void
}

export default function FilterByRoles({roles, onChange, label}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyRoleSelect label={label} selectedRoles={roles} onChange={onChange} />
    </Paper>
  )
}
