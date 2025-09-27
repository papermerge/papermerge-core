import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {showDocumentTypeDetailsInMainPanel} from "@/features/document-types/storage/thunks"
import {LoaderFunctionArgs} from "react-router"

export default function DocumentTypeDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(showDocumentTypeDetailsInMainPanel(entryID))
  }

  return {entryID, urlParams: url.searchParams}
}
