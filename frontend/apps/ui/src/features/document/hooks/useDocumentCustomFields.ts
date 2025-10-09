import {useGetDocumentCustomFieldsQuery} from "@/features/document/store/apiSlice"
import type {CustomFieldWithValue} from "@/types"
import {skipToken} from "@reduxjs/toolkit/query"
import {Dispatch, SetStateAction, useEffect, useState} from "react"

interface Args {
  docID?: string
}

interface UseDocumentCustomFieldsReturn {
  data: CustomFieldWithValue[] | undefined
  isSuccess: boolean
  isError: boolean
  refetch: () => void
  customFieldValues: CustomFieldWithValue[]
  setCustomFieldValues: Dispatch<SetStateAction<CustomFieldWithValue[]>>
}

export default function useDocumentCustomFields({
  docID
}: Args): UseDocumentCustomFieldsReturn {
  const [customFieldValues, setCustomFieldValues] = useState<
    CustomFieldWithValue[]
  >([])

  const {data, isSuccess, isError, refetch} = useGetDocumentCustomFieldsQuery(
    docID ?? skipToken
  )

  useEffect(() => {
    if (data && data.length > 0) {
      const initialCustFieldValues = data.map(i => {
        return {...i, value: i.value}
      })

      console.log(initialCustFieldValues)
      setCustomFieldValues(initialCustFieldValues)
    }
  }, [data, isSuccess])

  return {
    data,
    isSuccess,
    isError,
    refetch,
    customFieldValues,
    setCustomFieldValues
  }
}
