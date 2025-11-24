import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {currentSharedNodeChanged} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function SharedFolderView() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let folderId = "shared"

  if (params.folderId) {
    folderId = params.folderId
  }

  //store.dispatch(mainPanelComponentUpdated("sharedCommander"))

  store.dispatch(
    currentSharedNodeChanged({id: folderId, ctype: "folder", panel: "main"})
  )

  return {folderId, urlParams: url.searchParams}
}
