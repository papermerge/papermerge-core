import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"

export default function SharedNodesListView() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let categoryId

  return {categoryId, urlParams: url.searchParams}
}
