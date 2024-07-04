import UsersList from "@/components/users/List"
import {fetchUsers} from "@/slices/users"
import {store} from "@/app/store"

export default function UsersListPage() {
  return <UsersList />
}

export async function loader() {
  await store.dispatch(fetchUsers({pageNumber: 1}))

  return null
}
