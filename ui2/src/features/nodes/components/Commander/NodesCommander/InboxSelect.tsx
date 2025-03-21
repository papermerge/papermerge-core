import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import type {LastInbox} from "@/features/ui/uiSlice"
import {lastInboxUpdated, selectLastInbox} from "@/features/ui/uiSlice"
import {useGetUserGroupInboxesQuery} from "@/features/users/apiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import type {PanelMode} from "@/types"
import {ComboboxItem, ComboboxItemGroup, Select, Skeleton} from "@mantine/core"
import {useContext, useState} from "react"
import {useNavigate} from "react-router-dom"

export default function InboxSelect() {
  const user = useAppSelector(selectCurrentUser)
  const mode: PanelMode = useContext(PanelContext)
  const lastInbox = useAppSelector(s => selectLastInbox(s, mode))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const {data, isLoading} = useGetUserGroupInboxesQuery()
  const [value, setValue] = useState<ComboboxItem>({
    value: lastInbox?.inbox_id || user.inbox_folder_id,
    label: lastInbox?.label || "My Inbox"
  })

  const onChange = (_value: string | null, option: ComboboxItem) => {
    setValue(option)
    navigate(`/inbox/${option.value}`)
    let group_id

    if (data && data.length > 0) {
      let userGroupInbox = data.find(gh => gh.inbox_id == option.value)

      if (userGroupInbox) {
        group_id = userGroupInbox.group_id
      }
    }

    let last_inbox: LastInbox = {
      inbox_id: option.value,
      label: option.label
    }

    if (group_id) {
      last_inbox.group_id = group_id
    } else {
      last_inbox.user_id = user.id
    }

    dispatch(
      lastInboxUpdated({
        mode: mode,
        last_inbox: last_inbox
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
      group: "My Inbox",
      items: [{value: user.inbox_folder_id, label: "Inbox"}]
    }
  ]

  if (data && data?.length > 0) {
    let items = data.map(i => {
      return {value: i.inbox_id, label: i.group_name}
    })
    folders_data = folders_data.concat({
      group: "Group Inboxes",
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
