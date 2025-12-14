import {
  SearchFilterSuggestion,
  SearchSuggestion
} from "@/features/search/microcomp/types"
import {Combobox, Loader} from "@mantine/core"
import {TFunction} from "i18next"
import {ReactNode} from "react"

interface Args {
  suggestions?: SearchSuggestion[]
}

export default function AutocompleteOptions({suggestions}: Args) {
  let empty: ReactNode = (
    <Combobox.Option value="">
      <Loader />
    </Combobox.Option>
  )

  let components = []

  if (!suggestions || (suggestions && suggestions.length == 0)) {
    return empty
  }

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i]

    if (suggestion.type == "filter") {
      components.push(
        <AutocompleteFilterOptions
          key={suggestion.type}
          suggestion={suggestion}
        />
      )
    }
  }

  return (
    <Combobox.Options mah={300} style={{overflowY: "auto"}}>
      {components}
    </Combobox.Options>
  )
}

interface AutocompleFilterOptionsArg {
  suggestion: SearchFilterSuggestion
  t?: TFunction
}
function AutocompleteFilterOptions({
  suggestion,

  t
}: AutocompleFilterOptionsArg) {
  const ret = suggestion.items?.map(ac => (
    <Combobox.Option key={ac} value={ac}>
      {ac}
    </Combobox.Option>
  ))

  return (
    <Combobox.Group label={t?.("filters") || "Filters"}>{ret}</Combobox.Group>
  )
}
