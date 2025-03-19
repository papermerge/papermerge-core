import {useAppSelector} from "@/app/hooks"
import {useGetUserGroupHomesQuery} from "@/features/users/apiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import {ComboboxItem, ComboboxItemGroup, Select, Skeleton} from "@mantine/core"
import {useState} from "react"

export default function HomeSelect() {
  const user = useAppSelector(selectCurrentUser)
  const {data, isLoading} = useGetUserGroupHomesQuery()
  const [value, setValue] = useState<ComboboxItem>({
    value: user.home_folder_id,
    label: "My Home"
  })

  const onChange = (_value: string | null, option: ComboboxItem) => {
    console.log(option)
    setValue(option)
  }

  if (isLoading) {
    return (
      <Skeleton>
        <Select />
      </Skeleton>
    )
  }

  let folders_data: ComboboxItemGroup[] = [
    {
      group: "My Home",
      items: [{value: user.home_folder_id, label: "Home"}]
    }
  ]

  if (data && data?.length > 0) {
    let items = data.map(i => {
      return {value: i.home_id, label: i.group_name}
    })
    folders_data = folders_data.concat({
      group: "Group Homes",
      items: items
    })
  }

  return (
    <Select
      data={folders_data}
      value={value ? value.value : null}
      onChange={onChange}
      allowDeselect={false}
      defaultValue={"1"}
      searchable
      checkIconPosition="right"
    />
  )
}
