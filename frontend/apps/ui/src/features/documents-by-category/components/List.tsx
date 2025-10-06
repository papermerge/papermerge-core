import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectDocumentCategoryID} from "@/features/documents-by-category/storage/documentsByCategory"
import type {PanelMode} from "@/types"
import {useContext} from "react"
import PickupDocumentCategory from "./PickupDocumentCategory"

export default function DocumentsListByCagegory() {
  const mode: PanelMode = useContext(PanelContext)
  const categoryID = useAppSelector(s => selectDocumentCategoryID(s, mode))

  if (!categoryID) {
    return <PickupDocumentCategory />
  }

  return <></>
}
