import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {mainPanelRoleDetailsUpdated} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function RoleDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  store.dispatch(mainPanelRoleDetailsUpdated(entryID))

  return {entryID, urlParams: url.searchParams}
}
