import {useLocation} from "react-router-dom"
import HomeSelect from "./HomeSelect"
import InboxSelect from "./InboxSelect"

export default function SpecialFolderSelect() {
  const location = useLocation()
  if (location.pathname.includes("inbox")) {
    return <InboxSelect />
  }

  return <HomeSelect />
}
