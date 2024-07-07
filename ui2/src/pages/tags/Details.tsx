import {LoaderFunctionArgs, useLoaderData} from "react-router"
import TagDetails from "@/components/tags/TagDetails.tsx"
import {fetchTagDetails} from "@/slices/tagDetails"
import {store} from "@/app/store"

export default function TagDetailsPage() {
  const tagId = useLoaderData() as string

  if (tagId) {
    return <TagDetails />
  }

  throw Error("Detail page: missing tagId parameter")
}

export async function loader({params}: LoaderFunctionArgs) {
  if (params.tagId) {
    const tagId = params.tagId
    store.dispatch(fetchTagDetails(tagId))
    return params.tagId
  }

  throw Error("Loader: Missing groupId parameter")
}
