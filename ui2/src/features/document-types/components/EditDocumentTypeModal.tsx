import {OWNER_ME} from "@/cconstants"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/apiSlice"
import {
  Button,
  ComboboxItem,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  MultiSelect,
  Textarea,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import OwnerSelector from "@/components/OwnerSelect/OwnerSelect"
import {
  useEditDocumentTypeMutation,
  useGetDocumentTypeQuery
} from "@/features/document-types/apiSlice"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  documentTypeId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditDocumentTypeModal({
  documentTypeId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {t} = useTranslation()
  const [name, setName] = useState<string>("")
  const [pathTemplate, setPathTemplate] = useState<string>("")
  const [owner, setOwner] = useState<ComboboxItem>({label: OWNER_ME, value: ""})

  const {data: allCustomFields = []} = useGetCustomFieldsQuery(owner.value)
  const {data, isLoading} = useGetDocumentTypeQuery(documentTypeId)
  const [updateDocumentType, {isLoading: isLoadingGroupUpdate}] =
    useEditDocumentTypeMutation()

  const [customFieldIDs, setCustomFieldIDs] = useState<string[]>([])

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name || "")
      setPathTemplate(data.path_template || "")
      setCustomFieldIDs(data.custom_fields.map(cf => cf.id) || [])
      if (data.group_name && data.group_id) {
        setOwner({label: data.group_name, value: data.group_id})
      } else {
        setOwner({label: OWNER_ME, value: ""})
      }
    } else {
      setOwner({label: OWNER_ME, value: ""})
    }
  }

  const onOwnerChange = (option: ComboboxItem) => {
    setOwner(option)
    setCustomFieldIDs([])
  }

  const onLocalSubmit = async () => {
    const updatedDocumentType = {
      id: documentTypeId,
      name,
      path_template: pathTemplate,
      custom_field_ids: customFieldIDs
    }
    let dtData

    if (owner.value && owner.value != "") {
      dtData = {...updatedDocumentType, group_id: owner.value}
    } else {
      dtData = updatedDocumentType
    }
    try {
      await updateDocumentType(dtData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <Modal
      title={"Edit Category"}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
    >
      <LoadingOverlay
        visible={data == null || isLoading}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <TextInput
        value={name}
        onChange={e => setName(e.currentTarget.value)}
        label="Name"
        placeholder="name"
      />
      <MultiSelect
        label="Custom Fields"
        placeholder="Pick value"
        onChange={setCustomFieldIDs}
        searchable
        data={allCustomFields.map(i => {
          return {label: i.name, value: i.id}
        })}
        value={customFieldIDs}
      />
      <Textarea
        label="Path Template"
        resize="vertical"
        autosize
        minRows={6}
        value={pathTemplate}
        onChange={event => setPathTemplate(event.currentTarget.value)}
      />
      <OwnerSelector value={owner} onChange={onOwnerChange} />
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoadingGroupUpdate && <Loader size="sm" />}
          <Button disabled={isLoadingGroupUpdate} onClick={onLocalSubmit}>
            Update
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
