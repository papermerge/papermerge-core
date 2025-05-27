import CustomFieldDetails from "@/features/custom-fields/components/Details"
import {useParams} from "react-router"

export default function CustomFieldsPage() {
  const {customFieldID} = useParams()

  return <CustomFieldDetails customFieldId={customFieldID!} />
}
