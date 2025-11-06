import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {FreeTextToken} from "@/features/search/microcomp/types"
import {removeToken} from "@/features/search/storage/search"
import TokenPresentation from "./Token.presentation"

interface Args {
  index: number
}

export default function FTSTokenContainer({index}: Args) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(
    state => state.search.tokens[index]
  ) as FreeTextToken

  const handleRemove = () => {
    dispatch(removeToken(index))
  }

  return <TokenPresentation item={token} onRemove={handleRemove} />
}
