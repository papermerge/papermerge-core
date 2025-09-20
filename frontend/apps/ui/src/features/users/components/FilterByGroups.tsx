import {Paper} from "@mantine/core"
import type {TFunction} from "i18next"
import LazyGroupSelect from "./LazyGroupSelect"

interface Args {
  label: string
  groups?: string[]
  onChange?: (value: string[] | null) => void
  t?: TFunction
}

export default function FilterByGroups({groups, onChange, label, t}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyGroupSelect
        label={label}
        selectedGroups={groups}
        onChange={onChange}
        t={t}
      />
    </Paper>
  )
}
