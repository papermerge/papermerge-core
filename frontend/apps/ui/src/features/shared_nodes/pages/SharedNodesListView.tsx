import {store} from "@/app/store"
import {SHARED_FOLDER_ROOT_ID} from "@/cconstants"
import DualPanel from "@/components/DualPanel"
import {currentSharedNodeChanged} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function SharedNodesListView() {
  return <DualPanel />
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  //store.dispatch(mainPanelComponentUpdated("sharedCommander"))

  store.dispatch(
    currentSharedNodeChanged({
      id: SHARED_FOLDER_ROOT_ID,
      ctype: "folder",
      panel: "main"
    })
  )

  return {urlParams: url.searchParams}
}
