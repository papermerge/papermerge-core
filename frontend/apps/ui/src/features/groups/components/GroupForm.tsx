import CopyButton from "@/components/CopyButton"
import {TextInput} from "@mantine/core"

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
    </div>
  )
}
