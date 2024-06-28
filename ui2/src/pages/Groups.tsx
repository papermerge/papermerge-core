import Groups from "@/components/Groups"
import {fetchGroups} from "@/slices/groups"
import {store} from "@/app/store"

export default function GroupsPage() {
  return <Groups />
}

export async function loader() {
  await store.dispatch(fetchGroups())

  return null
}
