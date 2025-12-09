export type OptionValueMapping = {
  old_value: string
  new_value: string
}

export type OptionValueMappingWithCount = {
  old_value: string
  new_value: string
  count: number
}

export type OptionValuesChangesTotal = {
  mappings: OptionValueMappingWithCount[]
  total_count: number
}
