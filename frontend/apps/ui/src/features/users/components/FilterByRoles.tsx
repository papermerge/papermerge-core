import {Paper} from "@mantine/core"
import type {TFunction} from "i18next"
import LazyRoleSelect from "./LazyRoleSelect"

interface Args {
  label: string
  roles?: string[]
  onChange?: (value: string[] | null) => void
  t?: TFunction
}

export default function FilterByRoles({roles, onChange, label, t}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyRoleSelect
        label={label}
        selectedRoles={roles}
        onChange={onChange}
        t={t}
      />
    </Paper>
  )
}
