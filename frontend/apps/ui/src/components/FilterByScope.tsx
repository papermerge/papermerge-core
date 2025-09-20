import {Paper} from "@mantine/core"
import {TFunction} from "i18next"
import LazyScopesSelect from "./LazyScopesSelect"

interface Args {
  scopes?: string[]
  onChange?: (value: string[] | null) => void
  label: string
  t?: TFunction
}

export default function FilterByScope({scopes, onChange, t, label}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyScopesSelect
        label={label}
        t={t}
        selectedScopes={scopes}
        onChange={onChange}
      />
    </Paper>
  )
}
