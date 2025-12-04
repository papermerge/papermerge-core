import {useEffect, useState} from "react"

import MultiSelectCustomField from "@/features/custom-fields/components/MultiSelectCustomField"
import SelectCustomField from "@/features/custom-fields/components/SelectCustomField"
import {
  CustomFieldDate,
  CustomFieldMonetary,
  CustomFieldYearMonth
} from "../customFields"

import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"
import useDocumentCustomFields from "@/features/document/hooks/useDocumentCustomFields"
import {
  useUpdateDocumentCustomFieldsMutation,
  useUpdateDocumentTypeMutation
} from "@/features/document/store/apiSlice"
import type {DocumentType} from "@/features/document/types"
import type {CustomFieldWithValue} from "@/types"
import {
  Button,
  ComboboxItem,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput
} from "@mantine/core"
import {useTranslation} from "react-i18next"
import CustomFieldBoolean from "../customFields/Boolean"

interface Args {
  doc?: DocumentType
  docID?: string
  isLoading: boolean
}

export default function CustomFields({doc, docID, isLoading}: Args) {
  const {t} = useTranslation()
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false)
  const [documentTypeID, setDocumentTypeID] = useState<ComboboxItem | null>(
    null
  )
  const {data: allDocumentTypes = [], isSuccess: isSuccessAllDocumentTypes} =
    useGetDocumentTypesQuery(doc?.group_id)
  const [updateDocumentCustomFields, {error}] =
    useUpdateDocumentCustomFieldsMutation()
  const [updateDocumentType] = useUpdateDocumentTypeMutation()
  const {
    isError: isErrorGetDocCF,
    refetch: refetchCustomFields,
    customFieldValues,
    setCustomFieldValues
  } = useDocumentCustomFields({docID})

  useEffect(() => {
    /* Update (local) documentTypeID state based on the
    actual doc.document_type_id

    When both document's data is loaded AND all document types data are
    loaded - update currently selected item in "document type <Select /> component"
    */
    if (doc && doc.document_type_id) {
      // ok, document data is loaded and document has associated a non-empty document type
      if (
        allDocumentTypes &&
        allDocumentTypes.length > 0 &&
        isSuccessAllDocumentTypes
      ) {
        // ok, all document types were loaded as well.
        const foundDocType = allDocumentTypes.find(
          i => i.id == doc.document_type_id
        )
        if (foundDocType) {
          setDocumentTypeID({
            label: foundDocType.name,
            value: foundDocType.id
          })
        }
      }
    }
  }, [doc, isSuccessAllDocumentTypes])

  const onCustomFieldValueChanged = ({
    customField,
    value
  }: {
    customField: CustomFieldWithValue
    value: string | boolean
  }) => {
    const newCustomFieldValues = customFieldValues.map(cf => {
      if (cf.custom_field.name == customField.custom_field.name) {
        return {
          ...cf,
          value: {
            field_id: cf.value?.field_id,
            value: {
              raw: value
            }
          }
        }
      }

      return cf
    })

    setCustomFieldValues(newCustomFieldValues)
    setShowSaveButton(true)
  }

  const genericCustomFieldsComponents = customFieldValues.map(cf => (
    <GenericCustomField
      key={cf.custom_field.name}
      documentID={docID}
      customField={cf}
      onChange={onCustomFieldValueChanged}
    />
  ))

  const onDocumentTypeChange = async (_: any, option: ComboboxItem) => {
    const documentTypeIDToInvalidate =
      doc?.document_type_id || (option ? option.value : undefined)

    const data = {
      document_id: docID!,
      invalidatesTags: {
        documentTypeID: documentTypeIDToInvalidate
      },
      body: {
        document_type_id: option ? option.value : null
      }
    }
    await updateDocumentType(data)

    setDocumentTypeID(option)
    setCustomFieldValues([])
    setShowSaveButton(false)
    refetchCustomFields()
  }

  const onClearDocumentType = () => {
    setDocumentTypeID(null)
    setShowSaveButton(true)
    setCustomFieldValues([])
  }

  const onSave = async () => {
    if (!customFieldValues || customFieldValues.length === 0) {
      return
    }

    // Convert array to dict: { field_id: value }
    const content = customFieldValues.reduce(
      (acc, cf) => {
        const fieldId = cf.custom_field.id
        const value = cf.value?.value?.raw ?? cf.value

        if (fieldId) {
          acc[fieldId] = value
        }

        return acc
      },
      {} as Record<string, any>
    )

    if (Object.keys(content).length === 0) {
      return
    }

    try {
      await updateDocumentCustomFields({
        documentID: docID!,
        body: content
      }).unwrap()

      setShowSaveButton(false)
    } catch (error) {
      console.error("Failed to update custom fields:", error)
      // TODO: Show error notification to user
    }
  }

  if (isLoading || !docID || !doc) {
    return <Skeleton height={"20"} />
  }

  return (
    <>
      <Select
        label={t("common.category")}
        data={allDocumentTypes.map(i => {
          return {label: i.name, value: i.id}
        })}
        value={documentTypeID ? documentTypeID.value : null}
        placeholder={t("common.pick_value")}
        onChange={onDocumentTypeChange}
        onClear={onClearDocumentType}
        clearable
        searchable
      />
      <Stack>{genericCustomFieldsComponents}</Stack>
      {isErrorGetDocCF && (
        <Text c="red">
          Error while fetching custom fields. Error code cf98g62m.
        </Text>
      )}
      {showSaveButton && <Button onClick={onSave}>Save</Button>}
      {error && (
        <div>
          {/* @ts-ignore*/}
          {error.status} {JSON.stringify(error.data)}
        </div>
      )}
    </>
  )
}

interface GenericCustomFieldArg {
  customField: CustomFieldWithValue
  documentID?: string
  onChange: ({
    customField,
    value
  }: {
    customField: CustomFieldWithValue
    value: string | boolean
  }) => void
}

function GenericCustomField({
  customField,
  documentID,
  onChange
}: GenericCustomFieldArg) {
  const [value, setValue] = useState<string | boolean>(
    customField.value?.value?.raw
  )

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
    onChange({customField, value: e.currentTarget.value})
  }

  useEffect(() => {
    setValue(customField.value?.value?.raw)
  }, [customField.value])

  if (!documentID) {
    return <Skeleton height={"20"} />
  }

  if (customField.custom_field.type_handler == "date") {
    return <CustomFieldDate customField={customField} onChange={onChange} />
  }

  if (customField.custom_field.type_handler == "monetary") {
    return <CustomFieldMonetary customField={customField} onChange={onChange} />
  }

  if (customField.custom_field.type_handler == "boolean") {
    return <CustomFieldBoolean customField={customField} onChange={onChange} />
  }

  if (customField.custom_field.type_handler == "yearmonth") {
    return (
      <CustomFieldYearMonth customField={customField} onChange={onChange} />
    )
  }

  if (customField.custom_field.type_handler == "select") {
    return <SelectCustomField customField={customField} onChange={onChange} />
  }

  if (customField.custom_field.type_handler == "multiselect") {
    return (
      <MultiSelectCustomField customField={customField} onChange={onChange} />
    )
  }

  return (
    <TextInput
      label={customField.custom_field.name}
      value={customField.value?.value?.raw}
      onChange={onLocalChange}
    />
  )
}
