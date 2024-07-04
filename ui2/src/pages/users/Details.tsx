import {LoaderFunctionArgs, useLoaderData} from "react-router"
import UserDetails from "@/components/users/UserDetails.tsx"
import {fetchUserDetails} from "@/slices/userDetails"
import {store} from "@/app/store"

export default function UserDetailsPage() {
  const userId = useLoaderData() as string

  if (userId) {
    return <UserDetails />
  }

  throw Error("Detail page: missing userId parameter")
}

export async function loader({params}: LoaderFunctionArgs) {
  if (params.userId) {
    store.dispatch(fetchUserDetails(params.userId))
    return params.userId
  }

  throw Error("Loader: Missing userId parameter")
}
