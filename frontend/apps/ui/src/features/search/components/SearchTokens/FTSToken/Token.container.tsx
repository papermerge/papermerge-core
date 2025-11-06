import {useAppSelector} from "@/app/hooks"
import {FreeTextToken} from "@/features/search/microcomp/types"
import TokenPresentation from "./Token.presentation"

interface Args {
  index: number
}

export default function TagTokenContainer({index}: Args) {
  const token = useAppSelector(
    state => state.search.tokens[index]
  ) as FreeTextToken

  return <TokenPresentation item={token} />
}
