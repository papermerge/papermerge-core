import TagsList from "@/components/tags/List"
import {fetchTags} from "@/slices/tags"
import {store} from "@/app/store"

export default function TagsPage() {
  return <TagsList />
}

export async function loader() {
  const state = store.getState()
  await store.dispatch(
    fetchTags({pageNumber: 1, pageSize: state.tags.lastPageSize})
  )

  return null
}
