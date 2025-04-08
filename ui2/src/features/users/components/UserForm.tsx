import {TextInput, Checkbox, Stack, MultiSelect} from "@mantine/core"
import CopyButton from "@/components/CopyButton"

import {UserDetails} from "@/types"
import {useTranslation} from "react-i18next"

type Args = {
  user: UserDetails | null
}

export default function UserForm({user}: Args) {
  const {t} = useTranslation()
  return (
    <Stack>
      <TextInput
        label="ID"
        value={user?.id}
        onChange={() => {}}
        rightSection={<CopyButton value={user?.id || ""} />}
      />
      <TextInput
        label={t("users.form.username")}
        value={user?.username || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={user?.username || ""} />}
      />
      <TextInput
        label={t("users.form.email")}
        value={user?.email || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={user?.email || ""} />}
      />
      <Checkbox
        label={t("users.form.superuser")}
        checked={user?.is_superuser}
        onChange={() => {}}
      />
      <Checkbox
        label={t("users.form.active")}
        checked={user?.is_active}
        onChange={() => {}}
      />
      <MultiSelect
        label={t("users.form.groups")}
        readOnly={true}
        value={user?.groups.map(g => g.name)}
      />
    </Stack>
  )
}
