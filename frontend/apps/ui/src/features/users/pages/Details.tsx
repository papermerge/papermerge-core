import {useParams} from "react-router"
import UserDetails from "@/features/users/components/UserDetails.tsx"

export default function UserDetailsPage() {
  const {userId} = useParams()

  return <UserDetails userId={userId!} />
}
