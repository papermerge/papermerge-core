import {Paper} from "@mantine/core"
import LazyUserSelect from "./LazyUserSelect"

interface Args {
  users?: string[] // i.e. usernames
  onChange?: (value: string[] | null) => void
}

export default function UserFilter({users, onChange}: Args) {
  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <LazyUserSelect selectedUsers={users} onChange={onChange} />
    </Paper>
  )
}
