import {useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useState} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {
  CustomFieldDate,
  CustomFieldMonetary,
  CustomFieldYearMonth
} from "@/features/document/components/customFields"
import {skipToken} from "@reduxjs/toolkit/query"

import {useGetDocumentTypesQuery} from "@/features/document-types/apiSlice"
import {
  useGetDocumentCustomFieldsQuery,
  useUpdateDocumentCustomFieldsMutation,
  useUpdateDocumentTypeMutation
} from "@/features/document/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import type {CFV, PanelMode} from "@/types"
import {
  Button,
  ComboboxItem,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput
} from "@mantine/core"
import CustomFieldBoolean from "../customFields/Boolean"

export default function CustomFields() {
  const mode: PanelMode = useContext(PanelContext)
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false)
  const [customFieldValues, setCustomFieldValues] = useState<CFV[]>([])
  const [documentTypeID, setDocumentTypeID] = useState<ComboboxItem | null>(
    null
  )

  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))

  const {data: allDocumentTypes = [], isSuccess: isSuccessAllDocumentTypes} =
    useGetDocumentTypesQuery()
  const {currentData: doc, isLoading} = useGetDocumentQuery(docID ?? skipToken)
  const [updateDocumentCustomFields, {error}] =
    useUpdateDocumentCustomFieldsMutation()
  const [updateDocumentType] = useUpdateDocumentTypeMutation()
  const {
    data: documentCustomFields,
    isSuccess: isSuccessDocumentCustomFields,
    isError: isErrorGetDocCF,
    refetch: refetchCustomFields
  } = useGetDocumentCustomFieldsQuery(docID ?? skipToken)

  useEffect(() => {
    if (documentCustomFields && documentCustomFields.length > 0) {
      const initialCustFieldValues = documentCustomFields.map(i => {
        return {...i, value: i.value}
      })

      console.log(initialCustFieldValues)
      setCustomFieldValues(initialCustFieldValues)
    }
  }, [documentCustomFields, isSuccessDocumentCustomFields])

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
    customField: CFV
    value: string | boolean
  }) => {
    const newCustomFieldValues = customFieldValues.map(cf => {
      if (cf.name == customField.name) {
        return {...cf, value}
      }

      return cf
    })

    setCustomFieldValues(newCustomFieldValues)
    setShowSaveButton(true)
  }

  const genericCustomFieldsComponents = customFieldValues.map(cf => (
    <GenericCustomField
      key={cf.name}
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
    if (customFieldValues && customFieldValues.length > 0) {
      // document already has custom fields associated
      // we need to update existing custom field value
      const content = customFieldValues.map(i => {
        return {
          custom_field_value_id: i.custom_field_value_id,
          key: i.name,
          value: i.value
        }
      })

      const data = {
        documentID: docID!,
        documentTypeID: documentTypeID?.value!,
        body: content
      }
      await updateDocumentCustomFields(data)
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
  customField: CFV
  documentID?: string
  onChange: ({
    customField,
    value
  }: {
    customField: CFV
    value: string | boolean
  }) => void
}

function GenericCustomField({
  customField,
  documentID,
  onChange
}: GenericCustomFieldArg) {
  const [value, setValue] = useState<string | boolean>(customField.value)

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
    onChange({customField, value: e.currentTarget.value})
  }

  useEffect(() => {
    setValue(customField.value)
  }, [customField.value])

  if (!documentID) {
    return <Skeleton height={"20"} />
  }

  if (customField.type == "date") {
    return <CustomFieldDate customField={customField} onChange={onChange} />
  }

  if (customField.type == "monetary") {
    return <CustomFieldMonetary customField={customField} onChange={onChange} />
  }

  if (customField.type == "boolean") {
    return <CustomFieldBoolean customField={customField} onChange={onChange} />
  }

  if (customField.type == "yearmonth") {
    return (
      <CustomFieldYearMonth customField={customField} onChange={onChange} />
    )
  }

  return (
    <TextInput
      label={customField.name}
      value={value ? value.toString() : ""}
      onChange={onLocalChange}
    />
  )
}
