import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {documentCategoryIDUpdated} from "@/features/documentsList/storage/documentsByCategory"
import {LoaderFunctionArgs} from "react-router"
import {showDocumentsByCategoryListInPanel} from "../storage/thunks"

export default function RoleDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  if (params.id) {
    store.dispatch(showDocumentsByCategoryListInPanel("main"))
    store.dispatch(documentCategoryIDUpdated(params.id))
  }

  return {entryID: params.id, urlParams: url.searchParams}
}
