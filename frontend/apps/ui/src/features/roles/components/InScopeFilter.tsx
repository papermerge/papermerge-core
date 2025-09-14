import {Paper} from "@mantine/core"
import {TFunction} from "i18next"
import LazyScopesSelect from "./LazyScopesSelect"

interface Args {
  scopes?: string[]
  onChange?: (value: string[] | null) => void
  t?: TFunction
}

export default function InScopeFilter({scopes, onChange, t}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyScopesSelect
        label={
          t?.("roles.scopeFilter.label.includes") ?? "Includes these scopes"
        }
        t={t}
        selectedScopes={scopes}
        onChange={onChange}
      />
    </Paper>
  )
}
