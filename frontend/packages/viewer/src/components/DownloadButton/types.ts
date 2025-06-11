export type I18NDownloadButtonText = {
  downloadTooltip: string
  downloadInProgressTooltip: string
  loadingTooltip: string
  error: string // general error reported by BE
  emptyVersionsArrayError: string
}

export type DownloadDocumentVersion = {
  id: string
  number: number
  shortDescription: string
}
