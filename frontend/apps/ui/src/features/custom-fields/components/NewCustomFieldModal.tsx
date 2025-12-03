import {useAppSelector} from "@/app/hooks"
import {CURRENCIES} from "@/cconstants"
import OwnerSelect from "@/components/OwnerSelect"
import {useAddNewCustomFieldMutation} from "@/features/custom-fields/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import type {Owner} from "@/types"
import {CurrencyType, CustomFieldDataType} from "@/types"
import {extractApiError} from "@/utils/errorHandling"
import {
  Button,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Select,
  Text,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import {getCustomFieldTypes} from "../utils"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewCustomFieldModal({
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {t} = useTranslation()
  const currentUser = useAppSelector(selectCurrentUser)

  const [currency, setCurrency] = useState<CurrencyType>("EUR")
  const [addNewCustomField, {isLoading, isError, isSuccess}] =
    useAddNewCustomFieldMutation()
  const [name, setName] = useState<string>("")
  const [dataType, setDataType] = useState<CustomFieldDataType>("text")
  const [error, setError] = useState<string>("")
  // Initialize owner with current user
  const [owner, setOwner] = useState<Owner>({
    id: currentUser?.id || "",
    type: "user",
    label: "Me"
  })

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

  const onOwnerChange = (newOwner: Owner) => {
    setOwner(newOwner)
  }

  const onLocalSubmit = async () => {
    let extra_data: string | undefined

    if (dataType == "monetary") {
      extra_data = JSON.stringify({currency: currency})
    }

    const newCustomFieldData = {
      name,
      extra_data,
      type: dataType,
      owner_type: owner.type,
      owner_id: owner.id,
      type_handler: dataType
    }

    try {
      await addNewCustomField(newCustomFieldData).unwrap()
    } catch (err: unknown) {
      setError(
        extractApiError(
          err,
          t("custom_fields.form.error", {
            defaultValue: "Failed to create custom field"
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
    setDataType("text")
    setError("")
    setOwner({label: "Me", id: currentUser.id, type: "user"})
  }

  const onCurrencyChange = (value: string | null) => {
    setCurrency(value as CurrencyType)
  }

  return (
    <Modal
      title={t("custom_fields.new.title")}
      opened={opened}
      onClose={onLocalCancel}
    >
      <TextInput
        label={t("custom_fields.form.name")}
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder={t("custom_fields.form.name")}
      />
      <NativeSelect
        mt="sm"
        label={t("custom_fields.form.type")}
        value={dataType}
        data={getCustomFieldTypes(t)}
        onChange={e =>
          setDataType(e.currentTarget.value as CustomFieldDataType)
        }
      />
      {dataType == "monetary" && (
        <Select
          mt="sm"
          searchable
          label={t("custom_fields.form.currency")}
          value={currency}
          data={CURRENCIES}
          onChange={onCurrencyChange}
        />
      )}
      <OwnerSelect value={owner} onChange={onOwnerChange} />
      {isError && <Text c="red">{`${error}`}</Text>}
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
