import CopyButton from "@/components/CopyButton"
import OwnerIcon from "@/components/OwnerIcon"
import type {CustomFieldItem} from "@/features/custom-fields/types"
import {getCustomFieldTypes} from "@/features/custom-fields/utils"
import {Box, NativeSelect, TextInput} from "@mantine/core"
import {TFunction} from "i18next"

type Args = {
  customField: CustomFieldItem | null
  t?: TFunction
}

export default function CustomFieldForm({customField, t}: Args) {
  return (
    <Box>
      <TextInput
        my="md"
        label={t?.("customFieldColumns.id") || "ID"}
        value={customField?.id || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={customField?.id || ""} />}
      />
      <TextInput
        my="md"
        label={t?.("customFieldColumns.name") || "Name"}
        value={customField?.name || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={customField?.name || ""} />}
      />
      <NativeSelect
        mt="sm"
        label={t?.("customFieldColumns.type") || "Type"}
        value={customField?.type || ""}
        data={getCustomFieldTypes(t)}
        onChange={() => {}}
      />
      <TextInput
        my="md"
        label={t?.("customFieldColumns.owned_by") || "Owned By"}
        value={customField?.owned_by.name || "Me"}
        onChange={() => {}}
        leftSection={<OwnerIcon owner={customField?.owned_by} />}
        rightSection={<CopyButton value={customField?.owned_by.name || "Me"} />}
      />
    </Box>
  )
}
