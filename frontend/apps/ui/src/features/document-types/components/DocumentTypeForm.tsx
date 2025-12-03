import {OWNER_ME} from "@/cconstants"
import CopyButton from "@/components/CopyButton"
import OwnerIcon from "@/components/OwnerIcon"
import type {DocumentTypeDetails} from "@/features/document-types/types"
import type {CustomField} from "@/types"
import {
  Box,
  Fieldset,
  Skeleton,
  Table,
  TextInput,
  Textarea
} from "@mantine/core"
import {TFunction} from "i18next"

type Args = {
  documentType: DocumentTypeDetails | null
  t?: TFunction
}

export default function DocumentTypeForm({documentType, t}: Args) {
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
      <TextInput
        my="md"
        label={t?.("customFieldColumns.owned_by") || "Owned By"}
        value={documentType?.owned_by.name || OWNER_ME}
        onChange={() => {}}
        leftSection={<OwnerIcon owner={documentType?.owned_by} />}
        rightSection={
          <CopyButton value={documentType?.owned_by.name || OWNER_ME} />
        }
      />
    </Box>
  )
}

function CustomFieldTable({cfs}: {cfs?: Array<CustomField>}) {
  if (!cfs) {
    return <Skeleton />
  }

  const customFieldRows = cfs.map(i => <CustomFieldRow key={i.id} cf={i} />)

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
      <Table.Td>{cf.type_handler}</Table.Td>
    </Table.Tr>
  )
}
