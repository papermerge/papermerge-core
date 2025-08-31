import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {mainPanelAuditLogDetailsUpdated} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function AuditLogDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  store.dispatch(mainPanelAuditLogDetailsUpdated(entryID))

  return {entryID, urlParams: url.searchParams}
}
