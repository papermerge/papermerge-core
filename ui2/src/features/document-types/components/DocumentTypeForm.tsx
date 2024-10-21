import CopyButton from "@/components/CopyButton"
import type {CustomField} from "@/types"
import {
  Box,
  Fieldset,
  Skeleton,
  Table,
  TextInput,
  Textarea
} from "@mantine/core"
import type {DocType} from "../types"

type Args = {
  documentType: DocType | null
}

export default function DocumentTypeForm({documentType}: Args) {
  const custom_fields = documentType?.custom_fields
  const hasCustomFields = custom_fields ? custom_fields.length > 0 : false

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
      {hasCustomFields && (
        <CustomFieldTable cfs={documentType?.custom_fields} />
      )}
      <Textarea
        my="md"
        label="Path Template"
        autosize
        minRows={6}
        resize="vertical"
        onChange={() => {}}
        rightSection={<CopyButton value={documentType?.path_template || ""} />}
        value={documentType?.path_template}
      />
    </Box>
  )
}

function CustomFieldTable({cfs}: {cfs?: Array<CustomField>}) {
  if (!cfs) {
    return <Skeleton />
  }

  const customFieldRows = cfs.map(i => <CustomFieldRow cf={i} />)

  return (
    <Fieldset legend="Custom Fields">
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Data Type</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{customFieldRows}</Table.Tbody>
      </Table>
    </Fieldset>
  )
}

function CustomFieldRow({cf}: {cf: CustomField}) {
  return (
    <Table.Tr>
      <Table.Td>{cf.name}</Table.Td>
      <Table.Td>{cf.type}</Table.Td>
    </Table.Tr>
  )
}
