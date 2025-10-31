import {Combobox, Loader} from "@mantine/core"
import {ReactNode} from "react"
import Tag from "@/components/Tag"
import {SearchSuggestion} from "@/features/search/microcomp/types"
import {useGetTagsQuery} from "@/features/tags/storage/api"
import {skipToken} from "@reduxjs/toolkit/query"

interface Args {
  suggestions?: SearchSuggestion
}

export default function AutocompleteOptions({suggestions}: Args) {
  const {data: tags = [], isSuccess: tagsAreLoaded} = useGetTagsQuery(
    suggestions?.type === "tag" ? undefined : skipToken
  )

  let suggestionComponents: ReactNode = (
    <Combobox.Option value="">
      <Loader />
    </Combobox.Option>
  )

  if (suggestions?.type == "tag" && tagsAreLoaded) {
    const filterOne = tags.filter(t => !suggestions.exclude?.includes(t.name))
    const filterTwo = filterOne.filter(t =>
      t.name.toLocaleLowerCase().startsWith(suggestions.filter || "")
    )

    if (filterTwo.length === 0) {
      suggestionComponents = (
        <Combobox.Option value="" disabled>
          No tags found
        </Combobox.Option>
      )
    } else {
      suggestionComponents = filterTwo.map(t => (
        <Combobox.Option key={t.id} value={t.name}>
          <Tag item={t} />
        </Combobox.Option>
      ))
    }
  }

  if (suggestions?.type == "keyword" || suggestions?.type == "operator") {
    suggestionComponents = suggestions?.items?.map(ac => (
      <Combobox.Option key={ac} value={ac}>
        {ac}
      </Combobox.Option>
    ))
  }

  return suggestionComponents
}
