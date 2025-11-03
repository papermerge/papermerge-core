import {useAppSelector} from "@/app/hooks"
import SearchTokenCategoryComponent from "./CatToken"
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
  }

  return <>Unknown token</>
}
