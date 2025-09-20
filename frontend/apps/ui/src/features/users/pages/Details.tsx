import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {showUserDetailsInMainPanel} from "@/features/users/storage/thunks"
import {LoaderFunctionArgs} from "react-router"

export default function UserDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(showUserDetailsInMainPanel(entryID))
  }

  return {entryID, urlParams: url.searchParams}
}
