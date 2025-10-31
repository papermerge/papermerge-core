import {Combobox, Loader} from "@mantine/core"
import {ReactNode} from "react"
import Tag from "@/components/Tag"
import {
  SearchCustomFieldSuggestion,
  SearchCategorySuggestion,
  SearchOperatorSuggestion,
  SearchKeywordSuggestion,
  SearchSuggestion,
  SearchTagSuggestion
} from "@/features/search/microcomp/types"
import {useGetTagsQuery} from "@/features/tags/storage/api"
import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/storage/api"
import {skipToken} from "@reduxjs/toolkit/query"
import {hasThisTypeSuggestion} from "@/features/search/microcomp/utils"
import {ColoredTag} from "@/types"
import {TFunction} from "i18next"
import {Category} from "@/features/documents-by-category/types"
import {CustomField} from "@/types"

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

  console.log(suggestions)

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
    const group = suggestions.length > 1

    if (suggestion.type == "tag" && tagsAreLoaded) {
      components.push(
        <AutocompleTagOptions
          suggestion={suggestion}
          tags={tags}
          group={group}
        />
      )
    }

    if (suggestion.type == "category" && categoriesAreLoaded) {
      components.push(
        <AutocompleCategoryOptions
          suggestion={suggestion}
          items={categories}
          group={group}
        />
      )
    }

    if (suggestion.type == "customField" && customFieldsAreLoaded) {
      components.push(
        <AutocompleCustomFieldOptions
          suggestion={suggestion}
          items={customFields}
          group={group}
        />
      )
    }

    if (suggestion.type == "keyword") {
      components.push(
        <AutocompleteKeywordOptions suggestion={suggestion} group={group} />
      )
    }

    if (suggestion.type == "operator") {
      components.push(
        <AutocompleteOperatorOptions suggestion={suggestion} group={group} />
      )
    }
  }

  return components
}

interface AutocompleTagOptionsArg {
  tags: ColoredTag[]
  suggestion: SearchTagSuggestion
  group: boolean
  t?: TFunction
}

function AutocompleTagOptions({
  tags,
  suggestion,
  group,
  t
}: AutocompleTagOptionsArg) {
  const filterOne = tags.filter(t => !suggestion.exclude?.includes(t.name))
  const filterTwo = filterOne.filter(t =>
    t.name.toLocaleLowerCase().startsWith(suggestion.filter || "")
  )

  const ret = filterTwo.map(t => (
    <Combobox.Option key={t.id} value={t.name}>
      <Tag item={t} />
    </Combobox.Option>
  ))

  if (group) {
    return <Combobox.Group label={t?.("tags") || "Tags"}>{ret}</Combobox.Group>
  }

  return ret
}

interface AutocompleKeywordOptionsArg {
  suggestion: SearchKeywordSuggestion
  group: boolean
  t?: TFunction
}
function AutocompleteKeywordOptions({
  suggestion,
  group,
  t
}: AutocompleKeywordOptionsArg) {
  const ret = suggestion.items?.map(ac => (
    <Combobox.Option key={ac} value={ac}>
      {ac}
    </Combobox.Option>
  ))

  if (group) {
    return (
      <Combobox.Group label={t?.("keywords") || "Keywords"}>
        {ret}
      </Combobox.Group>
    )
  }

  return ret
}

interface AutocompleOperatorOptionsArg {
  suggestion: SearchOperatorSuggestion
  group: boolean
  t?: TFunction
}
function AutocompleteOperatorOptions({
  suggestion,
  group,
  t
}: AutocompleOperatorOptionsArg) {
  const ret = suggestion.items?.map(ac => (
    <Combobox.Option key={ac} value={ac}>
      {ac}
    </Combobox.Option>
  ))

  if (group) {
    return (
      <Combobox.Group label={t?.("operator") || "Operator"}>
        {ret}
      </Combobox.Group>
    )
  }

  return ret
}

interface AutocompleCategoryOptionsArgs {
  items: Category[]
  suggestion: SearchCategorySuggestion
  group: boolean
  t?: TFunction
}

function AutocompleCategoryOptions({
  items,
  suggestion,
  group,
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

  if (group) {
    return (
      <Combobox.Group label={t?.("categories") || "Categories"}>
        {ret}
      </Combobox.Group>
    )
  }

  return ret
}

interface AutocompleCustomFieldOptionsArgs {
  items: CustomField[]
  suggestion: SearchCustomFieldSuggestion
  group: boolean
  t?: TFunction
}

function AutocompleCustomFieldOptions({
  items,
  suggestion,
  group,
  t
}: AutocompleCustomFieldOptionsArgs) {
  const filterOne = items.filter(i => !suggestion.exclude?.includes(i.name))
  const filterTwo = filterOne.filter(i =>
    i.name.toLocaleLowerCase().startsWith(suggestion.filter || "")
  )

  const ret = filterTwo.map(i => (
    <Combobox.Option key={i.id} value={i.name}>
      {i.name}
    </Combobox.Option>
  ))

  if (group) {
    return (
      <Combobox.Group label={t?.("customFields") || "Custom Fields"}>
        {ret}
      </Combobox.Group>
    )
  }

  return ret
}
