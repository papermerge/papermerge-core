import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {FreeTextFilter} from "@/features/search/microcomp/types"
import {removeFilter} from "@/features/search/storage/search"
import FilterPresentation from "./Filter.presentation"

interface Args {
  index: number
}

export default function FTSFilterContainer({index}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as FreeTextFilter

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  return <FilterPresentation item={filter} onRemove={handleRemove} />
}
