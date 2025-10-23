export type CategoryColumn = {
  name: string
  visible: boolean
}

export type CategoryColumns = {
  document_type_id: string
  columns: Array<CategoryColumn>
}
