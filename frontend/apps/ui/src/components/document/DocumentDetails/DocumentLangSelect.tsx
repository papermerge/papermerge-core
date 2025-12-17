import DocumentLangSelect from "@/components/DocumentLangSelect"
import {
  useGetDocVerLangQuery,
  useUpdateDocVerLangMutation
} from "@/features/document/store/apiSlice"
import {Skeleton} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"

interface Args {
  doc_ver_id?: string
}

export default function DocumentLangSelectContainer({doc_ver_id}: Args) {
  const {data, isLoading} = useGetDocVerLangQuery(doc_ver_id ?? skipToken)

  // Update lang
  const [updateLang, {isLoading: isUpdating}] = useUpdateDocVerLangMutation()

  const onChange = (newValue: string | null) => {
    if (newValue && doc_ver_id) {
      updateLang({docVerId: doc_ver_id, lang: newValue})
    }
  }

  if (isLoading) {
    return <Skeleton height={"2rem"} />
  }

  if (!data?.lang) {
    return <>Failed to load document Lang</>
  }

  return <DocumentLangSelect value={data?.lang} onChange={onChange} />
}
