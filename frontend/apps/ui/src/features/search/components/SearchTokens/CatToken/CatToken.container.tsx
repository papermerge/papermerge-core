import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  CategoryOperator,
  CategoryToken
} from "@/features/search/microcomp/types"
import {removeToken, updateToken} from "@/features/search/storage/search"
import {CategoryTokenPresentation} from "./CatToken.presentation"

interface CategoryTokenContainerProps {
  index: number
}

export function CategoryTokenContainer({index}: CategoryTokenContainerProps) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(
    state => state.search.tokens[index]
  ) as CategoryToken

  const handleOperatorChange = (operator: CategoryOperator) => {
    dispatch(updateToken({index, updates: {operator}}))
  }

  const handleValuesChange = (values: string[]) => {
    dispatch(updateToken({index, updates: {values}}))
  }

  const handleRemove = () => {
    dispatch(removeToken(index))
  }

  return (
    <CategoryTokenPresentation
      item={token}
      onOperatorChange={handleOperatorChange}
      onValuesChange={handleValuesChange}
      onRemove={handleRemove}
    />
  )
}
