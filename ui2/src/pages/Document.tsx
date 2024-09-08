import {LoaderFunctionArgs} from "react-router"
import DualPanel from "@/components/DualPanel"
import {fetchPaginatedDocument} from "@/slices/dualPanel/dualPanel"

import {store} from "@/app/store"
import {currentNodeChanged} from "@/features/ui/uiSlice"

export default function Document() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const documentId = params.documentId

  store.dispatch(
    currentNodeChanged({
      id: params.documentId!,
      ctype: "document",
      panel: "main"
    })
  )

  await store.dispatch(
    fetchPaginatedDocument({
      nodeId: documentId!,
      panel: "main",
      urlParams: url.searchParams
    })
  )

  return {documentId, urlParams: url.searchParams}
}
