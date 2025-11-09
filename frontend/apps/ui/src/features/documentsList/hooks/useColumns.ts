import {useAppSelector} from "@/app/hooks"
import documentByCategoryColumns from "@/features/documentsList/components/columns"
import flatColumns from "@/features/documentsList/components/flatColumns"
import useDocumentsByCategoryTable from "@/features/documentsList/hooks/useDocumentsByCategoryTable"
import {selectDocumentCategoryID} from "@/features/documentsList/storage/documentsByCategory"
import {DocumentListItem} from "@/features/documentsList/types"
import {ColumnConfig} from "kommon"
import {useTranslation} from "react-i18next"

export default function useColumns(): ColumnConfig<DocumentListItem>[] {
  const {t} = useTranslation()
  const categoryID = useAppSelector(selectDocumentCategoryID)
  const {data} = useDocumentsByCategoryTable()

  if (categoryID) {
    return documentByCategoryColumns({items: data?.items, t})
  }

  return flatColumns(t)
}
