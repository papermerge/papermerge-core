import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {documentCategoryIDUpdated} from "@/features/documents-by-category/storage/documentsByCategory"
import {mainPanelComponentUpdated} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function DocByCategoryDetailsPage() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let entryID = "whatever"

  if (params.id) {
    entryID = params.id
  }

  if (entryID) {
    store.dispatch(mainPanelComponentUpdated("documentsListByCategory"))
    store.dispatch(documentCategoryIDUpdated({mode: "main", id: entryID}))
  }

  return {entryID, urlParams: url.searchParams}
}
