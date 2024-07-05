import {LoaderFunctionArgs, useLoaderData} from "react-router"
import GroupDetails from "@/components/groups/GroupDetails.tsx"
import {fetchGroupDetails} from "@/slices/groupDetails"
import {store} from "@/app/store"

export default function GroupDetailsPage() {
  const groupId = useLoaderData() as string

  if (groupId) {
    return <GroupDetails />
  }

  throw Error("Detail page: missing groupId parameter")
}

export async function loader({params}: LoaderFunctionArgs) {
  if (params.groupId) {
    const groupId = parseInt(params.groupId)
    store.dispatch(fetchGroupDetails(groupId))
    return params.groupId
  }

  throw Error("Loader: Missing groupId parameter")
}
