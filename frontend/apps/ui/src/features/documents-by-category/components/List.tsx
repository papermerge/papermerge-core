import {useAppSelector} from "@/app/hooks"
import {selectCommanderDocumentTypeID} from "@/features/ui/uiSlice"
import PickupDocumentCategory from "./PickupDocumentCategory"

export default function DocumentsListByCagegory() {
  const categoryID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, "main")
  )

  if (!categoryID) {
    return <PickupDocumentCategory />
  }

  return <></>
}
