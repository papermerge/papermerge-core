import {useAppSelector} from "@/app/hooks"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import CFDateToken from "./CFDateFilter"
import CFNumericToken from "./CFNumericFilter"

interface Args {
  index: number
}

export default function CustomFieldTokenComponent({index}: Args) {
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  if (
    filter.typeHandler &&
    ["int", "float", "monetary"].includes(filter.typeHandler)
  ) {
    return <CFNumericToken index={index} />
  }

  if (filter.typeHandler == "date") {
    return <CFDateToken index={index} />
  }

  return <>Unknown Custom Field Token: {filter.typeHandler}</>
}
