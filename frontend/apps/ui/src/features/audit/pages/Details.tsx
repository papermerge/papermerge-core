import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"
import {showAuditLogDetailsInMainPanel} from "../storage/thunks"

export default function AuditLogDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(showAuditLogDetailsInMainPanel(entryID))
  }

  return {entryID, urlParams: url.searchParams}
}
