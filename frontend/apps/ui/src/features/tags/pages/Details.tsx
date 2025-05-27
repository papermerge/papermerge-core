import {useParams} from "react-router"
import TagDetails from "@/features/tags/components/TagDetails.tsx"

export default function TagDetailsPage() {
  const {tagId} = useParams()

  return <TagDetails tagId={tagId!} />
}
