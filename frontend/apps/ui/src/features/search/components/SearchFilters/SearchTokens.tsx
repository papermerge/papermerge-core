import {useAppSelector} from "@/app/hooks"
import SearchTokenCategoryComponent from "./CatFilter"
import CustomFieldToken from "./CustomFieldFilter"
import FreeTextTokenComponent from "./FTSFilter"
import SearchTokenTagComponent from "./TagFilter"

export default function SearchTokens() {
  const filters = useAppSelector(state => state.search.filters)

  return (
    <>
      {filters.map((filter, index) => (
        <SearchToken key={index} index={index} />
      ))}
    </>
  )
}

interface SearchTokenArgs {
  index: number
}

function SearchToken({index}: SearchTokenArgs) {
  const filter = useAppSelector(state => state.search.filters[index])

  switch (filter.type) {
    case "tag":
      return <SearchTokenTagComponent index={index} />
    case "cat":
      return <SearchTokenCategoryComponent index={index} />
    case "fts":
      return <FreeTextTokenComponent index={index} />
    case "cf":
      return <CustomFieldToken index={index} />
  }

  return <>Unknown filter</>
}
