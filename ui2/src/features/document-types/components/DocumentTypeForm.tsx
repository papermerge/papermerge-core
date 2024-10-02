import CopyButton from "@/components/CopyButton"
import type {DocType} from "@/types"
import {Box, TextInput} from "@mantine/core"

type Args = {
  documentType: DocType | null
}

export default function DocumentTypeForm({documentType}: Args) {
  return (
    <Box>
      <TextInput
        my="md"
        label="ID"
        value={documentType?.id || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={documentType?.id || ""} />}
      />
      <TextInput
        my="md"
        label="Name"
        value={documentType?.name || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={documentType?.name || ""} />}
      />
    </Box>
  )
}
