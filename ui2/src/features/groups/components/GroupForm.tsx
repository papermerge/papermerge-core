import CopyButton from "@/components/CopyButton"
import {Checkbox, TextInput} from "@mantine/core"

import type {GroupDetails} from "@/types.d/groups"
import {useTranslation} from "react-i18next"

type Args = {
  group: GroupDetails | null
}

export default function GroupModal({group}: Args) {
  const {t} = useTranslation()
  return (
    <div>
      <TextInput
        value={group?.name || ""}
        readOnly={true}
        label={t("groups.form.name")}
        rightSection={<CopyButton value={group?.name || ""} />}
      />
      <Checkbox
        my="md"
        checked={Boolean(group?.home_folder_id && group?.inbox_folder_id)}
        readOnly={true}
        label="This group has special folders: inbox and home"
      />
      {group?.home_folder_id && (
        <TextInput
          my="sm"
          value={group.home_folder_id}
          readOnly={true}
          label="Home ID"
          rightSection={<CopyButton value={group?.home_folder_id || ""} />}
        />
      )}
      {group?.inbox_folder_id && (
        <TextInput
          my="sm"
          value={group.inbox_folder_id}
          readOnly={true}
          label="Inbox ID"
          rightSection={<CopyButton value={group?.inbox_folder_id || ""} />}
        />
      )}
    </div>
  )
}
