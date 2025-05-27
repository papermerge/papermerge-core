import DocumentTypeDetails from "@/features/document-types/components/Details"
import {useParams} from "react-router"

export default function CustomFieldsPage() {
  const {documentTypeID} = useParams()

  return <DocumentTypeDetails documentTypeId={documentTypeID!} />
}
