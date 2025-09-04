import {Paper} from "@mantine/core"
import {TFunction} from "i18next"
import LazyUserSelect from "./LazyUserSelect"

interface Args {
  users?: string[] // i.e. usernames
  onChange?: (value: string[] | null) => void
  t?: TFunction
}

export default function UserFilter({users, onChange, t}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyUserSelect t={t} selectedUsers={users} onChange={onChange} />
    </Paper>
  )
}
