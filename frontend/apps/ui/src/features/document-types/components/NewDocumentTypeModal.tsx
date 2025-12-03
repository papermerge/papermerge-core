import {useAppSelector} from "@/app/hooks"
import OwnerSelect from "@/components/OwnerSelect"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/storage/api"
import {useAddDocumentTypeMutation} from "@/features/document-types/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import type {Owner} from "@/types"
import {extractApiError} from "@/utils/errorHandling"
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
import {useEffect, useState} from "react"
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
  const currentUser = useAppSelector(selectCurrentUser)

  const [name, setName] = useState<string>("")
  const [pathTemplate, setPathTemplate] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [customFieldIDs, setCustomFieldIDs] = useState<string[]>([])

  // Initialize owner with current user
  const [owner, setOwner] = useState<Owner>({
    id: currentUser?.id || "",
    type: "user",
    label: "Me"
  })

  // Fetch custom fields based on current owner
  const {data: customFields = []} = useGetCustomFieldsQuery(owner)

  const [addDocumentType, {isLoading, isError, isSuccess}] =
    useAddDocumentTypeMutation()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      reset()
    }
  }, [opened])

  // Close dialog on success
  useEffect(() => {
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  const onNameChange = (value: string) => {
    setName(value)
  }

  const onOwnerChange = (newOwner: Owner) => {
    setOwner(newOwner)
    // Clear custom fields when owner changes since they're owner-specific
    setCustomFieldIDs([])
  }

  const onLocalSubmit = async () => {
    if (!name.trim()) {
      setError(
        t("document_types.form.name_required", {
          defaultValue: "Name is required"
        })
      )
      return
    }

    const newDocumentTypeData = {
      name: name.trim(),
      path_template: pathTemplate.trim(),
      custom_field_ids: customFieldIDs,
      owner_type: owner.type,
      owner_id: owner.id
    }

    try {
      await addDocumentType(newDocumentTypeData).unwrap()
      setError("")
    } catch (err: any) {
      setError(
        extractApiError(
          err,
          t("document_types.form.error", {
            defaultValue: "Failed to create document type"
          })
        )
      )
    }
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const reset = () => {
    setName("")
    setPathTemplate("")
    setCustomFieldIDs([])
    setError("")
    setOwner({
      id: currentUser?.id || "",
      type: "user",
      label: "Me"
    })
  }

  return (
    <Modal
      title={t("document_types.new.title")}
      opened={opened}
      onClose={onLocalCancel}
      size="lg"
    >
      <TextInput
        label={t("document_types.form.name")}
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder={t("document_types.form.name.placeholder", {
          defaultValue: "Enter document type name"
        })}
        value={name}
        required
        error={error && !name.trim() ? error : undefined}
      />

      <MultiSelect
        label={t("document_types.form.custom_fields")}
        placeholder={t("document_types.form.custom_fields.placeholder", {
          defaultValue: "Select custom fields"
        })}
        onChange={setCustomFieldIDs}
        searchable
        clearable
        data={customFields.map(field => ({
          label: field.name,
          value: field.id
        }))}
        value={customFieldIDs}
        description={t("document_types.form.custom_fields.description", {
          defaultValue: "Custom fields available for this owner"
        })}
      />

      <Textarea
        label={t("document_types.form.path_template")}
        placeholder={t("document_types.form.path_template.placeholder", {
          defaultValue: "e.g., /Archive/{year}/{document_type}"
        })}
        resize="vertical"
        value={pathTemplate}
        onChange={event => setPathTemplate(event.currentTarget.value)}
        description={t("document_types.form.path_template.description", {
          defaultValue:
            "Optional: Define where documents of this type should be stored"
        })}
      />

      <OwnerSelect
        value={owner}
        onChange={onOwnerChange}
        label={t("document_types.form.owner", {
          defaultValue: "Owner"
        })}
      />

      {isError && error && (
        <Text c="red" size="sm" mt="xs">
          {error}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading || !name.trim()} onClick={onLocalSubmit}>
            {t("common.submit")}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
