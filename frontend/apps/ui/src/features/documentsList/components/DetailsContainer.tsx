import {Viewer} from "@/features/document/components/Viewer"
import useCurrentDocVer from "@/features/documentsList//hooks/useCurrentDocVer"
import useCurrentDoc from "@/features/documentsList/hooks/useCurrentDoc"

export default function DocumentDetailsContainer() {
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()

  return <Viewer doc={doc} docVer={docVer} />
}
