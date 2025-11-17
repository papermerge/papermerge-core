import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"
import {
  CategoryFilter,
  CategoryOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {CategoryFilterPresentation} from "./CatFilter.presentation"

interface CategoryFilterContainerProps {
  index: number
}

export function CategoryFilterContainer({index}: CategoryFilterContainerProps) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(
    state => state.search.filters[index]
  ) as CategoryFilter
  const data = useGetDocumentTypesQuery(undefined)

  const handleOperatorChange = (operator: CategoryOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValuesChange = (values: string[]) => {
    dispatch(updateFilter({index, updates: {values}}))
  }

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  return (
    <CategoryFilterPresentation
      item={token}
      data={data}
      onOperatorChange={handleOperatorChange}
      onValuesChange={handleValuesChange}
      onRemove={handleRemove}
    />
  )
}
