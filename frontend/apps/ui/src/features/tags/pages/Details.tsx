import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {showTagDetailsInMainPanel} from "@/features/tags/storage/thunks"
import {LoaderFunctionArgs} from "react-router"

export default function TagDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(showTagDetailsInMainPanel(entryID))
  }

  return {entryID, urlParams: url.searchParams}
}
