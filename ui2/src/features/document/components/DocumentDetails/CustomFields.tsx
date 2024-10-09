import {useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useState} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {CustomFieldDate} from "@/features/document/components/customFields"
import {skipToken} from "@reduxjs/toolkit/query"

import {
  useGetDocumentTypeQuery,
  useGetDocumentTypesQuery
} from "@/features/document-types/apiSlice"
import {
  useAddDocumentCustomFieldsMutation,
  useGetDocumentCustomFieldsQuery,
  useUpdateDocumentCustomFieldsMutation
} from "@/features/document/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import type {DocumentCustomFieldValue, PanelMode} from "@/types"
import {Button, ComboboxItem, Select, Skeleton, TextInput} from "@mantine/core"

export default function CustomFields() {
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false)
  const {data: allDocumentTypes = [], isSuccess: isSuccessAllDocumentTypes} =
    useGetDocumentTypesQuery()
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc, isLoading} = useGetDocumentQuery(docID ?? skipToken)
  const [documentTypeID, setDocumentTypeID] = useState<ComboboxItem | null>(
    null
  )
  const {currentData: documentType} = useGetDocumentTypeQuery(
    documentTypeID?.value ?? skipToken
  )
  const [customFieldValues, setCustomFieldValues] = useState<
    DocumentCustomFieldValue[]
  >([])
  const [updateDocumentCustomFields, {error}] =
    useUpdateDocumentCustomFieldsMutation()
  const [addDocumentCustomFields] = useAddDocumentCustomFieldsMutation()
  const {data: documentCustomFields, isSuccess: isSuccessDocumentCustomFields} =
    useGetDocumentCustomFieldsQuery(docID ?? skipToken)

  useEffect(() => {
    if (
      documentTypeID &&
      documentTypeID.value == doc?.document_type_id &&
      isSuccessDocumentCustomFields &&
      documentCustomFields &&
      documentCustomFields.length > 0
    ) {
      const initialCustFieldValues = documentCustomFields.map(i => {
        return {...i, value: i.value}
      })
      setCustomFieldValues(initialCustFieldValues)
    } else if (documentType?.custom_fields) {
      const initialCustFieldValues = documentType?.custom_fields.map(i => {
        return {...i, value: ""}
      })
      setCustomFieldValues(initialCustFieldValues)
    }
  }, [documentType?.custom_fields, isSuccessDocumentCustomFields])

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
    customField: DocumentCustomFieldValue
    value: string
  }) => {
    const newCustomFieldValues = customFieldValues.map(cf => {
      if (cf.id == customField.id) {
        return {...cf, value}
      }

      return cf
    })
    setCustomFieldValues(newCustomFieldValues)
    setShowSaveButton(true)
  }

  const genericCustomFieldsComponents = customFieldValues.map(cf => (
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
    if (
      documentTypeID &&
      documentTypeID.value == doc?.document_type_id &&
      isSuccessDocumentCustomFields &&
      documentCustomFields &&
      documentCustomFields.length > 0
    ) {
      const initialCustFieldValues = documentCustomFields.map(i => {
        return {...i, value: i.value}
      })
      setCustomFieldValues(initialCustFieldValues)
    }
  }

  const onClear = () => {
    setDocumentTypeID(null)
    setShowSaveButton(true)
    setCustomFieldValues([])
  }

  const onSave = async () => {
    if (documentCustomFields && documentCustomFields.length > 0) {
      // document already has custom fields associated
      // we need to update existing custom field value
      const data = {
        documentID: docID!,
        body: {
          document_type_id: documentTypeID?.value!,
          custom_fields: customFieldValues.map(i => {
            return {custom_field_value_id: i.id, value: i.value}
          })
        }
      }
      await updateDocumentCustomFields(data)
    } else {
      // document does not have custom field values associated
      // create new ones based on field_id
      const data = {
        documentID: docID!,
        body: {
          document_type_id: documentTypeID?.value!,
          custom_fields: customFieldValues.map(i => {
            return {custom_field_id: i.id, value: i.value}
          })
        }
      }

      await addDocumentCustomFields(data)
    }

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
        onClear={onClear}
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
  customField: DocumentCustomFieldValue
  documentID?: string
  onChange: ({
    customField,
    value
  }: {
    customField: DocumentCustomFieldValue
    value: string
  }) => void
}

function GenericCustomField({
  customField,
  documentID,
  onChange
}: GenericCustomFieldArg) {
  const [value, setValue] = useState<string>(customField.value)

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
    onChange({customField, value: e.currentTarget.value})
  }

  if (!documentID) {
    return <Skeleton height={"20"} />
  }

  if (customField.data_type == "date") {
    return <CustomFieldDate customField={customField} onChange={onChange} />
  }

  return (
    <TextInput
      label={customField.name}
      value={value}
      onChange={onLocalChange}
    />
  )
}
