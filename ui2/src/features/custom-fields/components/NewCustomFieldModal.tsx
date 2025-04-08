import {useEffect, useState} from "react"

import {CURRENCIES, CUSTOM_FIELD_DATA_TYPES} from "@/cconstants"
import OwnerSelector from "@/components/OwnerSelect/OwnerSelect"
import {useAddNewCustomFieldMutation} from "@/features/custom-fields/apiSlice"
import {CurrencyType, CustomFieldDataType} from "@/types"
import {
  Button,
  ComboboxItem,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Select,
  Text,
  TextInput
} from "@mantine/core"
import {useTranslation} from "react-i18next"

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
  const [currency, setCurrency] = useState<CurrencyType>("EUR")
  const [addNewCustomField, {isLoading, isError, isSuccess}] =
    useAddNewCustomFieldMutation()
  const [name, setName] = useState<string>("")
  const [owner, setOwner] = useState<ComboboxItem>({label: "Me", value: ""})
  const [dataType, setDataType] = useState<CustomFieldDataType>("text")
  const [error, setError] = useState<string>("")

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

  const onOwnerChange = (option: ComboboxItem) => {
    setOwner(option)
    console.log(option)
  }

  const onLocalSubmit = async () => {
    let extra_data: string | undefined

    if (dataType == "monetary") {
      extra_data = JSON.stringify({currency: currency})
    }

    const newCustomFieldData = {
      name,
      extra_data,
      type: dataType
    }

    let cfData
    if (owner.value && owner.value != "") {
      cfData = {...newCustomFieldData, group_id: owner.value}
    } else {
      cfData = newCustomFieldData
    }

    try {
      await addNewCustomField(cfData).unwrap()
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
    setDataType("text")
    setError("")
    setOwner({label: "Me", value: ""})
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
        data={CUSTOM_FIELD_DATA_TYPES}
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
      <OwnerSelector value={owner} onChange={onOwnerChange} />
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
