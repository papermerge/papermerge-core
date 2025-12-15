import {useAppSelector} from "@/app/hooks"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import CFDateFilter from "./CFDateFilter"
import CFNumericFilter from "./CFNumericFilter"
import CFSelectTypeHandler from "./CFSelectTypeHandler"
import CFMultiSelectFilter from "./MultiSelect"
import CFSelectFilter from "./Select"

interface Args {
  index: number
}

export default function CustomFieldTokenComponent({index}: Args) {
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  if (!filter) {
    return <>Filter not found</>
  }

  if (!filter.typeHandler) {
    return <CFSelectTypeHandler index={index} />
  }

  if (
    filter.typeHandler &&
    ["int", "float", "monetary"].includes(filter.typeHandler)
  ) {
    return <CFNumericFilter index={index} />
  }

  if (filter.typeHandler == "date") {
    return <CFDateFilter index={index} />
  }

  if (filter.typeHandler == "multiselect") {
    return <CFMultiSelectFilter index={index} />
  }

  if (filter.typeHandler == "select") {
    return <CFSelectFilter index={index} />
  }

  return <>Unknown Custom Field Token: {filter.typeHandler}</>
}
