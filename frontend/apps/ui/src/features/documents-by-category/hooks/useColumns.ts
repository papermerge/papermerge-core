import {useAppSelector} from "@/app/hooks"
import {selectDocumentCategoryID} from "@/features/documents-by-category/storage/documentsByCategory"
import {useTranslation} from "react-i18next"
import {ColumnConfig} from "kommon"
import useDocumentsByCategoryTable from "@/features/documents-by-category/hooks/useDocumentsByCategoryTable"
import documentByCategoryColumns from "@/features/documents-by-category/components/columns"
import {DocumentByCategoryItem} from "@/features/documents-by-category/types"
import flatColumns from "@/features/documents-by-category/components/flatColumns"

export default function useColumns(): ColumnConfig<DocumentByCategoryItem>[] {
  const {t} = useTranslation()
  const categoryID = useAppSelector(selectDocumentCategoryID)
  const {data} = useDocumentsByCategoryTable()

  if (categoryID) {
    return documentByCategoryColumns({items: data?.items, t})
  }

  return flatColumns(t)
}
