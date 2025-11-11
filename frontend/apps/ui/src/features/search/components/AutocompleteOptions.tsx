import Tag from "@/components/Tag"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/storage/api"
import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"
import {Category} from "@/features/documentsList/types"
import {
  SearchCategorySuggestion,
  SearchCustomFieldSuggestion,
  SearchFilterSuggestion,
  SearchOperatorSuggestion,
  SearchSuggestion,
  SearchTagSuggestion
} from "@/features/search/microcomp/types"
import {hasThisTypeSuggestion} from "@/features/search/microcomp/utils"
import {useGetTagsQuery} from "@/features/tags/storage/api"
import {ColoredTag, CustomField} from "@/types"
import {Combobox, Loader} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {TFunction} from "i18next"
import {ReactNode} from "react"

interface Args {
  suggestions?: SearchSuggestion[]
}

export default function AutocompleteOptions({suggestions}: Args) {
  const {data: tags = [], isSuccess: tagsAreLoaded} = useGetTagsQuery(
    hasThisTypeSuggestion({suggestions, type: "tag"}) ? undefined : skipToken
  )

  const {data: categories = [], isSuccess: categoriesAreLoaded} =
    useGetDocumentTypesQuery(
      hasThisTypeSuggestion({suggestions, type: "category"})
        ? undefined
        : skipToken
    )

  const {data: customFields = [], isSuccess: customFieldsAreLoaded} =
    useGetCustomFieldsQuery(
      hasThisTypeSuggestion({suggestions, type: "customField"})
        ? undefined
        : skipToken
    )

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

    if (suggestion.type == "tag" && tagsAreLoaded) {
      components.push(
        <AutocompleTagOptions suggestion={suggestion} tags={tags} />
      )
    }

    if (suggestion.type == "category" && categoriesAreLoaded) {
      components.push(
        <AutocompleCategoryOptions
          key={suggestion.type}
          suggestion={suggestion}
          items={categories}
        />
      )
    }

    if (suggestion.type == "customField" && customFieldsAreLoaded) {
      components.push(
        <AutocompleCustomFieldOptions
          key={suggestion.type}
          suggestion={suggestion}
          items={customFields}
        />
      )
    }

    if (suggestion.type == "filter") {
      components.push(
        <AutocompleteFilterOptions
          key={suggestion.type}
          suggestion={suggestion}
        />
      )
    }

    if (suggestion.type == "operator") {
      components.push(
        <AutocompleteOperatorOptions
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

interface AutocompleTagOptionsArg {
  tags: ColoredTag[]
  suggestion: SearchTagSuggestion
  t?: TFunction
}

function AutocompleTagOptions({tags, suggestion, t}: AutocompleTagOptionsArg) {
  const filterOne = tags.filter(t => !suggestion.exclude?.includes(t.name))
  const filterTwo = filterOne.filter(t =>
    t.name.toLocaleLowerCase().startsWith(suggestion.filter || "")
  )

  const ret = filterTwo.map(t => (
    <Combobox.Option key={t.id} value={t.name}>
      <Tag item={t} />
    </Combobox.Option>
  ))
  return <Combobox.Group label={t?.("tags") || "Tags"}>{ret}</Combobox.Group>
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

interface AutocompleOperatorOptionsArg {
  suggestion: SearchOperatorSuggestion
  t?: TFunction
}

function AutocompleteOperatorOptions({
  suggestion,
  t
}: AutocompleOperatorOptionsArg) {
  const ret = suggestion.items?.map(ac => (
    <Combobox.Option key={ac} value={ac}>
      {ac}
    </Combobox.Option>
  ))

  return (
    <Combobox.Group label={t?.("operator") || "Operator"}>{ret}</Combobox.Group>
  )
}

interface AutocompleCategoryOptionsArgs {
  items: Category[]
  suggestion: SearchCategorySuggestion
  t?: TFunction
}

function AutocompleCategoryOptions({
  items,
  suggestion,
  t
}: AutocompleCategoryOptionsArgs) {
  const filterOne = items.filter(i => !suggestion.exclude?.includes(i.name))
  const filterTwo = filterOne.filter(i =>
    i.name.toLocaleLowerCase().startsWith(suggestion.filter || "")
  )

  const ret = filterTwo.map(i => (
    <Combobox.Option key={i.id} value={i.name}>
      {i.name}
    </Combobox.Option>
  ))

  return (
    <Combobox.Group label={t?.("categories") || "Categories"}>
      {ret}
    </Combobox.Group>
  )
}

interface AutocompleCustomFieldOptionsArgs {
  items: CustomField[]
  suggestion: SearchCustomFieldSuggestion
  t?: TFunction
}

function AutocompleCustomFieldOptions({
  items,
  suggestion,
  t
}: AutocompleCustomFieldOptionsArgs) {
  const filterOne = items.filter(i => !suggestion.exclude?.includes(i.name))
  const filterTwo = filterOne.filter(i =>
    i.name.toLocaleLowerCase().startsWith(suggestion.filter || "")
  )

  const ret = filterTwo.map(i => (
    <Combobox.Option
      key={i.id}
      value={i.name}
      data-type-handler={i.type_handler}
      data-suggestion-type="customField"
    >
      {i.name}
    </Combobox.Option>
  ))

  return (
    <Combobox.Group label={t?.("customFields") || "Custom Fields"}>
      {ret}
    </Combobox.Group>
  )
}
