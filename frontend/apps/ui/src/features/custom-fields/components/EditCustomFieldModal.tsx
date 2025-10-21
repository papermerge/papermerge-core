import OwnerSelect from "@/components/OwnerSelect"
import {useAppSelector} from "@/app/hooks"
import type {CurrencyType, CustomFieldDataType} from "@/types"
import {
  Button,
  ComboboxItem,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  NativeSelect,
  Select,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"
import type {Owner} from "@/types"

import {
  useEditCustomFieldMutation,
  useGetCustomFieldQuery
} from "@/features/custom-fields/storage/api"
import {
  getCurrencies,
  getCustomFieldTypes
} from "@/features/custom-fields/utils"
import {useTranslation} from "react-i18next"
import {selectCurrentUser} from "@/slices/currentUser"

interface Args {
  opened: boolean
  customFieldId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditCustomFieldModal({
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
    data?.type_handler || "text"
  )
  const currentUser = useAppSelector(selectCurrentUser)

  const [owner, setOwner] = useState<Owner>({
    id: currentUser?.id || "",
    type: "user",
    label: "Me"
  })
  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name || "")
      if (data.owned_by && data.owned_by.type == "group") {
        setOwner({value: data.owned_by.id, label: data.owned_by.name})
      } else {
        setOwner({value: "", label: "Me"})
      }
    }
  }

  const onLocalSubmit = async () => {
    let extra_data: string | undefined

    if (dataType == "monetary") {
      extra_data = JSON.stringify({currency: currency})
    }

    const updatedData = {
      id: customFieldId,
      name: name,
      type_handler: dataType,
      extra_data: extra_data
    }

    let cfData
    if (owner.value && owner.value != "") {
      // @ts-ignore
      cfData = {...updatedData, group_id: owner.value}
    } else {
      cfData = updatedData
    }

    await updateCustomField(cfData)
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

  const onOwnerChange = (option: ComboboxItem) => {
    setOwner(option)
  }

  return (
    <Modal
      title={t("custom_fields.edit.title")}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
      transitionProps={{duration: 0}}
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
        data={getCustomFieldTypes(t)}
        onChange={e =>
          setDataType(e.currentTarget.value as CustomFieldDataType)
        }
      />
      <OwnerSelect value={owner} onChange={onOwnerChange} />
      {dataType == "monetary" && (
        <Select
          mt="sm"
          searchable
          label="Currency"
          value={currency}
          data={getCurrencies(t)}
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
