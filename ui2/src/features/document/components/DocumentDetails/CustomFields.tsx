import {useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useState} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {skipToken} from "@reduxjs/toolkit/query"

import {
  useGetDocumentTypeQuery,
  useGetDocumentTypesQuery
} from "@/features/document-types/apiSlice"
import {
  useGetDocumentCustomFieldsQuery,
  useUpdateDocumentCustomFieldsMutation
} from "@/features/document/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import type {CustomField, CustomFieldValueType, PanelMode} from "@/types"
import {Button, ComboboxItem, Select, Skeleton, TextInput} from "@mantine/core"

export default function CustomFields() {
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false)
  const {data: allDocumentTypes = []} = useGetDocumentTypesQuery()
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc, isLoading} = useGetDocumentQuery(docID ?? skipToken)
  const [documentTypeID, setDocumentTypeID] = useState<ComboboxItem | null>(
    null
  )
  const {currentData: documentType, isLoading: documentTypeIsLoading} =
    useGetDocumentTypeQuery(documentTypeID?.value ?? skipToken)
  const [customFieldValues, setCustomFieldValues] = useState<
    CustomFieldValueType[]
  >([])
  const [updateDocumentCustomFields, {error}] =
    useUpdateDocumentCustomFieldsMutation()
  const {data: documentCustomFields} = useGetDocumentCustomFieldsQuery(
    docID ?? skipToken
  )

  useEffect(() => {
    if (documentType?.custom_fields) {
      const initialCustFieldValues = documentType?.custom_fields.map(i => {
        return {custom_field_id: i.id, value: ""}
      })
      setCustomFieldValues(initialCustFieldValues)
    }
  }, [documentType?.custom_fields])

  const onCustomFieldValueChanged = ({
    customField,
    value
  }: {
    customField: CustomField
    value: string
  }) => {
    const newCustomFieldValues = customFieldValues.map(cf => {
      if (cf.custom_field_id == customField.id) {
        return {custom_field_id: cf.custom_field_id, value}
      }

      return cf
    })
    setCustomFieldValues(newCustomFieldValues)
    setShowSaveButton(true)
  }

  const genericCustomFieldsComponents = documentType?.custom_fields.map(cf => (
    <GenericCustomField
      key={cf.id}
      documentID={docID}
      customField={cf}
      onChange={onCustomFieldValueChanged}
    />
  ))

  const onDocumentTypeChange = (_: any, option: ComboboxItem) => {
    setDocumentTypeID(option)
    if (option && option.value != doc?.document_type_id) {
      setShowSaveButton(true)
    } else {
      setShowSaveButton(false)
    }
  }

  const onSave = async () => {
    const data = {
      documentID: docID!,
      body: {
        document_type_id: documentTypeID?.value!,
        custom_fields: customFieldValues
      }
    }

    await updateDocumentCustomFields(data)

    setShowSaveButton(false)
  }

  if (isLoading || !docID || !doc) {
    return <Skeleton height={"20"} />
  }

  return (
    <>
      <Select
        label="Document Type"
        data={allDocumentTypes.map(i => {
          return {label: i.name, value: i.id}
        })}
        value={documentTypeID ? documentTypeID.value : null}
        placeholder="Pick Value"
        onChange={onDocumentTypeChange}
        clearable
      />
      {genericCustomFieldsComponents}
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
  customField: CustomField
  documentID?: string
  onChange: ({
    customField,
    value
  }: {
    customField: CustomField
    value: string
  }) => void
}

function GenericCustomField({
  customField,
  documentID,
  onChange
}: GenericCustomFieldArg) {
  const [value, setValue] = useState<string>("")

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
    onChange({customField, value: e.currentTarget.value})
  }

  if (!documentID) {
    return <Skeleton height={"20"} />
  }

  return (
    <TextInput
      label={customField.name}
      value={value}
      onChange={onLocalChange}
    />
  )
}
