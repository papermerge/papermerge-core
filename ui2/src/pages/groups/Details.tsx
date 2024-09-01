import {useParams} from "react-router"
import {GroupDetails} from "@/features/groups/components"

export default function GroupDetailsPage() {
  const {groupId} = useParams()

  return <GroupDetails groupId={groupId!} />
}
