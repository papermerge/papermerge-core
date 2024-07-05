import GroupsList from "@/components/groups/List"
import {fetchGroups} from "@/slices/groups"
import {store} from "@/app/store"

export default function GroupsPage() {
  return <GroupsList />
}

export async function loader() {
  await store.dispatch(fetchGroups({pageNumber: 1}))

  return null
}
