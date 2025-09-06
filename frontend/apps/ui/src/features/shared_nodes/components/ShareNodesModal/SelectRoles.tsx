import {useGetRolesQuery} from "@/features/roles/storage/api"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"

interface Args {
  onChange: (value: string[]) => void
}

export default function SelectRoles({onChange}: Args) {
  const [roles, setRoles] = useState<string[]>([])
  const {data, isLoading} = useGetRolesQuery()

  const onChangeLocal = (value: string[]) => {
    setRoles(value)
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
        label="Roles"
        placeholder="Pick value"
        value={roles}
        onChange={onChangeLocal}
        data={data.map(g => g.name)}
      />
    </Stack>
  )
}
