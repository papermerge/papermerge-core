import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {TagOperator, TagToken} from "@/features/search/microcomp/types"
import {updateToken} from "@/features/search/storage/search"
import {TagTokenPresentation} from "./TagToken.presentation"

interface TagTokenContainerProps {
  index: number
}

export function TagTokenContainer({index}: TagTokenContainerProps) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(state => state.search.tokens[index]) as TagToken

  const handleOperatorChange = (operator: TagOperator) => {
    dispatch(updateToken({index, updates: {operator}}))
  }

  const handleValuesChange = (values: string[]) => {
    dispatch(updateToken({index, updates: {values}}))
  }

  return (
    <TagTokenPresentation
      item={token}
      onOperatorChange={handleOperatorChange}
      onValuesChange={handleValuesChange}
    />
  )
}
