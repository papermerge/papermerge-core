export type MoveDocumentDirection = "left" | "right"
export type ExtractPagesDirection = "left" | "right"

export interface I18NViewerContextMenu {
  changeTitle: string
  ocrText: string
  rotateClockwise: string
  rotateCounterClockwise: string
  resetChanges: string
  saveChanges: string
  deletePages: string
  moveDocument: string
  extractPages: string
  deleteDocument: string
  dangerZone: string
}
