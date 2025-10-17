import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {setPanelComponent} from "@/features/ui/panelRegistry"
import {LoaderFunctionArgs} from "react-router"

export default function DocumentsListByCategoryPage() {
  return <DualPanel />
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "documentsListByCategory"
    })
  )

  return {urlParams: url.searchParams}
}
