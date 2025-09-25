import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {showCustomFieldDetailsInMainPanel} from "@/features/custom-fields/storage/thunks"
import {LoaderFunctionArgs} from "react-router"

export default function CustomFieldDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(showCustomFieldDetailsInMainPanel(entryID))
  }

  return {entryID, urlParams: url.searchParams}
}
