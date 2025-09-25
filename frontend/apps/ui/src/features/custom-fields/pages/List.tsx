import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {mainPanelComponentUpdated} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function CustomFieldsListPage() {
  return <DualPanel />
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  store.dispatch(mainPanelComponentUpdated("customFieldsList"))

  return {urlParams: url.searchParams}
}
