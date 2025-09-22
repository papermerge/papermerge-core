import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {mainPanelComponentUpdated} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function GroupsListPage() {
  return <DualPanel />
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  store.dispatch(mainPanelComponentUpdated("groupsList"))

  return {urlParams: url.searchParams}
}
