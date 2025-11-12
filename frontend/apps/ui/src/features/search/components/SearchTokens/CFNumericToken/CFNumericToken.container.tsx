import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  CustomFieldNumericOperator,
  CustomFieldToken
} from "@/features/search/microcomp/types"
import {removeToken, updateToken} from "@/features/search/storage/search"
import {CFNumericTokenPresentation} from "./CFNumericToken.presentation"

interface CFNumericTokenContainerProps {
  index: number
}

export function CFNumericTokenContainer({index}: CFNumericTokenContainerProps) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(
    state => state.search.tokens[index]
  ) as CustomFieldToken

  // Redux handlers
  const handleOperatorChange = (operator: CustomFieldNumericOperator) => {
    dispatch(updateToken({index, updates: {operator}}))
  }

  const handleValueChange = (value: string | number) => {
    const num = parseInt(value as string)
    dispatch(updateToken({index, updates: {value: num}}))
  }

  const handleRemove = () => {
    dispatch(removeToken(index))
  }

  return (
    <CFNumericTokenPresentation
      item={token}
      onRemove={handleRemove}
      onValueChange={handleValueChange}
      onOperatorChange={handleOperatorChange}
    />
  )
}
