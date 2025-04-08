import type {CurrencyType, CustomFieldDataType} from "@/types"
import {
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  NativeSelect,
  Select,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import {CURRENCIES, CUSTOM_FIELD_DATA_TYPES} from "@/cconstants"
import {
  useEditCustomFieldMutation,
  useGetCustomFieldQuery
} from "@/features/custom-fields/apiSlice"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  customFieldId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditGroupModal({
  customFieldId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {t} = useTranslation()
  const [currency, setCurrency] = useState<CurrencyType>("EUR")
  const {data, isLoading} = useGetCustomFieldQuery(customFieldId)
  const [updateCustomField, {isLoading: isLoadingGroupUpdate}] =
    useEditCustomFieldMutation()
  const [name, setName] = useState<string>("")
  const [dataType, setDataType] = useState<CustomFieldDataType>(
    data?.type || "text"
  )

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name || "")
    }
  }

  const onLocalSubmit = async () => {
    let extra_data: string | undefined

    if (dataType == "monetary") {
      extra_data = JSON.stringify({currency: currency})
    }

    let updatedData = {
      id: customFieldId,
      name: name,
      type: dataType,
      extra_data: extra_data
    }

    await updateCustomField(updatedData)
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  const onCurrencyChange = (value: string | null) => {
    setCurrency(value as CurrencyType)
  }

  return (
    <Modal
      title={t("custom_fields.edit.title")}
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
        label={t("custom_fields.form.name")}
        placeholder={t("custom_fields.form.type")}
      />
      <NativeSelect
        mt="sm"
        label="Type"
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
          label="Currency"
          value={currency}
          data={CURRENCIES}
          onChange={onCurrencyChange}
        />
      )}

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
