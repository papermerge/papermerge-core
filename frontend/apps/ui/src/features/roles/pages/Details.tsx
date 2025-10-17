import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"
import {showRoleDetailsInMainPanel} from "../storage/thunks"

export default function RoleDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  if (params.id) {
    store.dispatch(showRoleDetailsInMainPanel(params.id))
  }

  return {entryID: params.id, urlParams: url.searchParams}
}
