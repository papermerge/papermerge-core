import {useAppDispatch} from "@/app/hooks"
import DocumentLangSelect from "@/components/DocumentLangSelect"
import {useCurrentDocVer} from "@/features/document/hooks"
import {Skeleton} from "@mantine/core"

export default function DocumentLangSelectContainer() {
  const {docVer} = useCurrentDocVer()
  const dispatch = useAppDispatch()

  const onChange = (newValue: string | null) => {
    if (newValue) {
    }
  }

  if (!docVer) {
    return <Skeleton height={"2rem"} />
  }

  return <DocumentLangSelect value={docVer?.lang} onChange={onChange} />
}
