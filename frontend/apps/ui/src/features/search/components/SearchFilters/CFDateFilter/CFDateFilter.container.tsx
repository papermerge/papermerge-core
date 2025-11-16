import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  CustomFieldFilter,
  CustomFieldNumericOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {CFDateFilterPresentation} from "./CFDateFilter.presentation"

interface CFNumericFilterContainerProps {
  index: number
}

export function CFDateFilterContainer({index}: CFNumericFilterContainerProps) {
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
    <CFDateFilterPresentation
      item={token}
      onRemove={handleRemove}
      onValueChange={handleValueChange}
      onOperatorChange={handleOperatorChange}
    />
  )
}
