import {useAppSelector} from "@/app/hooks"
import SearchFilterCategoryComponent from "./CatFilter"
import CustomFieldFilter from "./CustomFieldFilter"
import FreeTextFilterComponent from "./FTSFilter"
import SearchFilterTagComponent from "./TagFilter"

export default function SearchFilters() {
  const filters = useAppSelector(state => state.search.filters)

  return (
    <>
      {filters.map((_, index) => (
        <SearchFilter key={index} index={index} />
      ))}
    </>
  )
}

interface SearchFilterArgs {
  index: number
}

function SearchFilter({index}: SearchFilterArgs) {
  const filter = useAppSelector(state => state.search.filters[index])

  switch (filter.type) {
    case "tag":
      return <SearchFilterTagComponent index={index} />
    case "cat":
      return <SearchFilterCategoryComponent index={index} />
    case "fts":
      return <FreeTextFilterComponent index={index} />
    case "md":
      return <CustomFieldFilter index={index} />
  }

  return <>Unknown filter</>
}
