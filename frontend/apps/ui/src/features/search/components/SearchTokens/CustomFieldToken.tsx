import {useAppSelector} from "@/app/hooks"
import {CustomFieldToken} from "@/features/search/microcomp/types"
import CFDateToken from "./CFDateToken"
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

  if (token.typeHandler == "date") {
    return <CFDateToken index={index} />
  }

  return <>Unknown Custom Field Token: {token.typeHandler}</>
}
