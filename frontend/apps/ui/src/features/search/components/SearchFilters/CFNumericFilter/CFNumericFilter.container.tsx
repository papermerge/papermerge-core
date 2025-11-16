import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  CustomFieldFilter,
  CustomFieldNumericOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {CFNumericFilterPresentation} from "./CFNumericFilter.presentation"

interface CFNumericFilterContainerProps {
  index: number
}

export function CFNumericFilterContainer({
  index
}: CFNumericFilterContainerProps) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  // Redux handlers
  const handleOperatorChange = (operator: CustomFieldNumericOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (value: string | number) => {
    const num = parseInt(value as string)
    dispatch(updateFilter({index, updates: {value: num}}))
  }

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  return (
    <CFNumericFilterPresentation
      item={token}
      onRemove={handleRemove}
      onValueChange={handleValueChange}
      onOperatorChange={handleOperatorChange}
    />
  )
}
