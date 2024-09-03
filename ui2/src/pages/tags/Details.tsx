import {useParams} from "react-router"
import TagDetails from "@/components/tags/TagDetails.tsx"

export default function TagDetailsPage() {
  const {tagId} = useParams()

  return <TagDetails tagId={tagId!} />
}
