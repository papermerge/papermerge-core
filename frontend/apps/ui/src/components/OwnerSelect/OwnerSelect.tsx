import {useGetUserGroupHomesQuery} from "@/features/users/apiSlice"

import {ComboboxItem, ComboboxItemGroup, Select, Skeleton} from "@mantine/core"

interface Args {
  value: ComboboxItem
  onChange: (value: ComboboxItem) => void
}

export default function OwnerSelector({onChange, value}: Args) {
  const {data, isLoading} = useGetUserGroupHomesQuery()

  const onLocalChange = (_value: string | null, option: ComboboxItem) => {
    onChange(option)
  }

  if (isLoading) {
    return (
      <Skeleton>
        <Select />
      </Skeleton>
    )
  }

  let owners_data: ComboboxItemGroup[] = [
    {
      group: "Me",
      items: [{value: "", label: "Me"}]
    }
  ]

  if (data && data?.length > 0) {
    let items = data.map(i => {
      return {value: i.group_id, label: i.group_name}
    })
    owners_data = owners_data.concat({
      group: "My Groups",
      items: items
    })
  }

  return (
    <Select
      mt="md"
      label={"Owner"}
      data={owners_data}
      value={value ? value.value : null}
      onChange={onLocalChange}
      allowDeselect={false}
      defaultValue={""}
      searchable
      checkIconPosition="right"
    />
  )
}
