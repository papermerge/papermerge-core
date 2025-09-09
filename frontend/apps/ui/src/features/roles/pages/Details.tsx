import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"
import {showRoleDetailsInMainPanel} from "../storage/thunks"

export default function RoleDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(showRoleDetailsInMainPanel(entryID))
  }

  return {entryID, urlParams: url.searchParams}
}
