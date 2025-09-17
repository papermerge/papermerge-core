import {useGetUsersQuery} from "@/features/users/storage/api"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"

interface Args {
  onChange: (value: string[]) => void
}

export default function SelectUsers({onChange}: Args) {
  const [users, setUsers] = useState<string[]>([])
  const {data, isLoading} = useGetUsersQuery()

  const onChangeLocal = (value: string[]) => {
    setUsers(value)
    onChange(value)
  }

  if (isLoading || !data) {
    return (
      <Stack>
        <Skeleton />
      </Stack>
    )
  }

  return (
    <Stack my={"md"}>
      <MultiSelect
        searchable
        label="Users"
        placeholder="Pick value"
        value={users}
        onChange={onChangeLocal}
        data={data.map(u => u.username)}
      />
    </Stack>
  )
}
