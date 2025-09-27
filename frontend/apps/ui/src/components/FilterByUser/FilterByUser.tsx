import {Paper} from "@mantine/core"
import {TFunction} from "i18next"
import LazyUsersSelect from "./LazyUsersSelect"

interface Args {
  users?: string[]
  onChange?: (value: string[] | null) => void
  label: string
  t?: TFunction
}

export default function FilterByUser({users, onChange, t, label}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyUsersSelect
        label={label}
        t={t}
        selectedScopes={users}
        onChange={onChange}
      />
    </Paper>
  )
}
