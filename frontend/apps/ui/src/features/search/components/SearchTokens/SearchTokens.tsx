import {Token} from "@/features/search/microcomp/types"
import SearchTokenCategoryComponent from "./CatToken"
import SearchTokenTagComponent from "./TagToken"

interface Args {
  items: Token[]
}

export default function SearchTokens({items}: Args) {
  const components = items.map((i, index) => (
    <SearchToken key={index} item={i} />
  ))

  return <>{components}</>
}

interface SearchTokenArgs {
  item: Token
}

function SearchToken({item}: SearchTokenArgs) {
  switch (item.type) {
    case "tag":
      return <SearchTokenTagComponent item={item} />
    case "cat":
      return <SearchTokenCategoryComponent item={item} />
  }

  return <>Unknown token</>
}
