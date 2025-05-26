import {RoleDetails} from "@/features/roles/components"
import {useParams} from "react-router"

export default function RoleDetailsPage() {
  const {roleId} = useParams()

  return <RoleDetails roleId={roleId!} />
}
