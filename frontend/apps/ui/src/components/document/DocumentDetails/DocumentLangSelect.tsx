import DocumentLangSelect from "@/components/DocumentLangSelect"
import {useCurrentDocVer} from "@/features/document/hooks"
import {
  useGetDocVerLangQuery,
  useUpdateDocVerLangMutation
} from "@/features/document/store/apiSlice"
import {Skeleton} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"

export default function DocumentLangSelectContainer() {
  const {docVer} = useCurrentDocVer()
  // Get lang
  const {data, isLoading} = useGetDocVerLangQuery(docVer?.id ?? skipToken)

  // Update lang
  const [updateLang, {isLoading: isUpdating}] = useUpdateDocVerLangMutation()

  const onChange = (newValue: string | null) => {
    if (newValue && docVer?.id) {
      updateLang({docVerId: docVer.id, lang: newValue})
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
