import {CUSTOM_FIELD_DATA_TYPES} from "@/cconstants"
import CopyButton from "@/components/CopyButton"
import type {CustomField} from "@/types"
import {Box, NativeSelect, TextInput} from "@mantine/core"

type Args = {
  customField: CustomField | null
}

export default function CustomFieldForm({customField}: Args) {
  return (
    <Box>
      <TextInput
        my="md"
        label="ID"
        value={customField?.id || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={customField?.id || ""} />}
      />
      <TextInput
        my="md"
        label="Name"
        value={customField?.name || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={customField?.name || ""} />}
      />
      <NativeSelect
        mt="sm"
        label="Type"
        value={customField?.type || ""}
        data={CUSTOM_FIELD_DATA_TYPES}
        onChange={() => {}}
      />
    </Box>
  )
}
