import DualPanel from "@/components/DualPanel"
import {
  commanderDocumentTypeIDUpdated,
  commanderViewOptionUpdated,
  mainPanelComponentUpdated
} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

import {store} from "@/app/store"

export default function DocumentsListView() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let categoryId

  if (params.categoryId) {
    categoryId = params.categoryId
    store.dispatch(
      commanderDocumentTypeIDUpdated({mode: "main", documentTypeID: categoryId})
    )
  }

  store.dispatch(mainPanelComponentUpdated("commander"))

  store.dispatch(
    commanderViewOptionUpdated({mode: "main", viewOption: "document-type"})
  )

  return {categoryId, urlParams: url.searchParams}
}
