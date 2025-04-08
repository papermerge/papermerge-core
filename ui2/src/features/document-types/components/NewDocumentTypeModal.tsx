import {useEffect, useState} from "react"

import {useGetCustomFieldsQuery} from "@/features/custom-fields/apiSlice"
import {useAddDocumentTypeMutation} from "@/features/document-types/apiSlice"
import {
  Button,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Text,
  TextInput,
  Textarea
} from "@mantine/core"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewDocumentTypeModal({
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {t} = useTranslation()
  const [name, setName] = useState<string>("")
  const [pathTemplate, setPathTemplate] = useState<string>("")
  const [error, setError] = useState<string>("")

  const {data = []} = useGetCustomFieldsQuery()
  const [addDocumentType, {isLoading, isError, isSuccess}] =
    useAddDocumentTypeMutation()
  const [customFieldIDs, setCustomFieldIDs] = useState<string[]>([])

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  const onNameChange = (value: string) => {
    setName(value)
  }

  const onLocalSubmit = async () => {
    const newDocumentTypeData = {
      name,
      path_template: pathTemplate,
      custom_field_ids: customFieldIDs
    }
    try {
      await addDocumentType(newDocumentTypeData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const reset = () => {
    setName("")
    setCustomFieldIDs([])
    setError("")
  }

  return (
    <Modal
      title={t("document_types.new.title")}
      opened={opened}
      onClose={onLocalCancel}
    >
      <TextInput
        label={t("document_types.form.name")}
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder={t("document_types.form.name")}
      />
      <MultiSelect
        label={t("document_types.form.custom_fields")}
        placeholder={t("document_types.form.custom_fields.placeholder")}
        onChange={setCustomFieldIDs}
        searchable
        data={data.map(i => {
          return {label: i.name, value: i.id}
        })}
        value={customFieldIDs}
      />
      <Textarea
        label={t("document_types.form.path_template")}
        resize="vertical"
        value={pathTemplate}
        onChange={event => setPathTemplate(event.currentTarget.value)}
      />
      {isError && <Text c="red">{`${error}`}</Text>}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onLocalSubmit}>
            {t("common.submit")}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
