import {useAppSelector} from "@/app/hooks"
import SearchTokenCategoryComponent from "./CatToken"
import CustomFieldToken from "./CustomFieldToken"
import FreeTextTokenComponent from "./FTSToken"
import SearchTokenTagComponent from "./TagToken"

export default function SearchTokens() {
  const tokens = useAppSelector(state => state.search.tokens)

  return (
    <>
      {tokens.map((token, index) => (
        <SearchToken key={index} index={index} />
      ))}
    </>
  )
}

interface SearchTokenArgs {
  index: number
}

function SearchToken({index}: SearchTokenArgs) {
  const token = useAppSelector(state => state.search.tokens[index])

  switch (token.type) {
    case "tag":
      return <SearchTokenTagComponent index={index} />
    case "cat":
      return <SearchTokenCategoryComponent index={index} />
    case "fts":
      return <FreeTextTokenComponent index={index} />
    case "cf":
      return <CustomFieldToken index={index} />
  }

  return <>Unknown token</>
}
