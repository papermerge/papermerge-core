import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import type {LastHome} from "@/features/ui/uiSlice"
import {lastHomeUpdated, selectLastHome} from "@/features/ui/uiSlice"
import {useGetUserGroupHomesQuery} from "@/features/users/apiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import type {PanelMode} from "@/types"
import {ComboboxItem, ComboboxItemGroup, Select, Skeleton} from "@mantine/core"
import {useContext, useState} from "react"
import {useNavigate} from "react-router-dom"

export default function HomeSelect() {
  const user = useAppSelector(selectCurrentUser)
  const mode: PanelMode = useContext(PanelContext)
  const lastHome = useAppSelector(s => selectLastHome(s, mode))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const {data, isLoading} = useGetUserGroupHomesQuery()
  const [value, setValue] = useState<ComboboxItem>({
    value: lastHome?.home_id || user.home_folder_id,
    label: lastHome?.label || "My Home"
  })

  const onChange = (_value: string | null, option: ComboboxItem) => {
    setValue(option)
    navigate(`/home/${option.value}`)
    let group_id

    if (data && data.length > 0) {
      let userGroupHome = data.find(gh => gh.home_id == option.value)

      if (userGroupHome) {
        group_id = userGroupHome.group_id
      }
    }

    let last_home: LastHome = {
      home_id: option.value,
      label: option.label
    }

    if (group_id) {
      last_home.group_id = group_id
    } else {
      last_home.user_id = user.id
    }

    dispatch(
      lastHomeUpdated({
        mode: mode,
        last_home: last_home
      })
    )
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
