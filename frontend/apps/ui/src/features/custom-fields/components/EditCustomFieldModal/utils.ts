import type {SelectOption} from "@/features/custom-fields/components/SelectOptions"
import {CustomFieldItem} from "../../types"
import type {
  OptionValueMapping,
  OptionValueMappingWithCount,
  OptionValuesChangesTotal
} from "./types"

export function haveValueOptionChanged(
  options: SelectOption[],
  data?: CustomFieldItem
): boolean {
  if (!data) {
    return false
  }

  const initialOptions = data.config.options as SelectOption[]
  if (initialOptions.length !== options.length) {
    return true
  }

  for (let i = 0; i < options.length; i++) {
    if (initialOptions[i].value !== options[i].value) {
      return true
    }
  }

  return false
}

export function changedValueOptionList(
  options: SelectOption[],
  data?: CustomFieldItem
): OptionValueMapping[] {
  let arr: OptionValueMapping[] = []

  if (!data) {
    return arr
  }

  const initialOptions = data.config.options as SelectOption[]
  if (initialOptions.length !== options.length) {
    return arr
  }

  for (let i = 0; i < options.length; i++) {
    if (initialOptions[i].value !== options[i].value) {
      arr.push({
        old_value: initialOptions[i].value,
        new_value: options[i].value
      })
    }
  }

  return arr
}

interface GetOptionValuesArgs {
  counts: Record<string, number>
  mappings: OptionValueMapping[]
}

export function wrapOptionValueChanges({
  counts,
  mappings
}: GetOptionValuesArgs): OptionValuesChangesTotal {
  let arr: OptionValueMappingWithCount[] = []
  let total = 0

  for (let i = 0; i < mappings.length; i++) {
    const count = counts[mappings[i].old_value]
    const entry = {
      new_value: mappings[i].new_value,
      old_value: mappings[i].old_value,
      count: count
    }
    arr.push(entry)
    total += count
  }

  return {
    mappings: arr,
    total_count: total
  }
}

export function isSelect(data?: CustomFieldItem): boolean {
  if (!data) {
    return false
  }

  if (data.type_handler != "multiselect" && data.type_handler != "select") {
    return false
  }

  return true
}
