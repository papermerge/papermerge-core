import {useAppSelector} from "@/app/hooks"
import {CustomFieldToken} from "@/features/search/microcomp/types"
import CFNumericToken from "./CFNumericToken"

interface Args {
  index: number
}

export default function CustomFieldTokenComponent({index}: Args) {
  const token = useAppSelector(
    state => state.search.tokens[index]
  ) as CustomFieldToken

  if (["int", "float", "monetary"].includes(token.typeHandler)) {
    return <CFNumericToken index={index} />
  }

  return <>Unknown Custom Field Token</>
}
