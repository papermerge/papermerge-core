import Users from "@/components/Users"
import {fetchUsers} from "@/slices/users"
import {store} from "@/app/store"

export default function UsersPage() {
  return <Users />
}

export async function loader() {
  await store.dispatch(fetchUsers({pageNumber: 1}))

  return null
}
