import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"
import {showAuditLogDetailsInMainPanel} from "../storage/thunks"

export default function AuditLogDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  if (params.id) {
    store.dispatch(showAuditLogDetailsInMainPanel(params.id))
  }

  return {entryID: params.id, urlParams: url.searchParams}
}
