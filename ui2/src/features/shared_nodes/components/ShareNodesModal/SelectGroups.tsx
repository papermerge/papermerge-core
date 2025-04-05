import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"

interface Args {
  onChange: (value: string[]) => void
}

export default function SelectGroups({onChange}: Args) {
  const [groups, setGroups] = useState<string[]>([])
  const {data, isLoading} = useGetGroupsQuery()

  const onChangeLocal = (value: string[]) => {
    setGroups(value)
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
        label="Groups"
        placeholder="Pick value"
        value={groups}
        onChange={onChangeLocal}
        data={data.map(g => g.name)}
      />
    </Stack>
  )
}
