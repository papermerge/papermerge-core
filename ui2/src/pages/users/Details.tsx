import {useParams} from "react-router"
import UserDetails from "@/components/users/UserDetails.tsx"

export default function UserDetailsPage() {
  const {userId} = useParams()

  return <UserDetails userId={userId!} />
}
