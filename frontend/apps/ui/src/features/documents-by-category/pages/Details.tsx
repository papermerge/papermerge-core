import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"
import {showDocumentsByCategoryListInPanel} from "../storage/thunks"
import {documentCategoryIDUpdated} from "@/features/documents-by-category/storage/documentsByCategory"

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
