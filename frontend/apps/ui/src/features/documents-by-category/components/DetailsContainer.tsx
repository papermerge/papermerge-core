import {Viewer} from "@/features/document/components/Viewer"
import useCurrentDocVer from "@/features/documents-by-category//hooks/useCurrentDocVer"
import useCurrentDoc from "@/features/documents-by-category/hooks/useCurrentDoc"

export default function DocumentDetailsContainer() {
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()

  return <Viewer doc={doc} docVer={docVer} />
}
