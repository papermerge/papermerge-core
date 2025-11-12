export const TAG = "tag"
export const TAG_OP_ALL = "all"
export const TAG_OP_ANY = "any"
export const TAG_OP_NOT = "not"
export const TAG_OP = [TAG_OP_ALL, TAG_OP_ANY, TAG_OP_NOT]
export const TAG_IMPLICIT_OPERATOR = TAG_OP_ALL
export const CATEGORY = "cat"
export const CATEGORY_IMPLICIT_OPERATOR = "any"
export const CUSTOM_FIELD = "cf"
export const CUSTOM_FIELD_IMPLICIT_OPERATOR = "="

export const FILTERS = [
  "cat:", // Category
  "tag:",
  "cf:",
  "title:",
  "created_at:",
  "created_by:",
  "updated_at:",
  "updated_by:",
  "owner:"
]

export const OPERATOR_NUMERIC = [">=:", ">:", "<=:", "<:", "=:", "!=:"]
export const OPERATOR_TEXT = [
  "=:",
  "contains:",
  "iContains:",
  "startsWith:",
  "iStartsWith:"
]
