import {useAppDispatch} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentTypesQuery} from "@/features/document-types/apiSlice"
import {commanderDocumentTypeIDUpdated} from "@/features/ui/uiSlice"
import {Select} from "@mantine/core"
import {useContext, useState} from "react"

import type {PanelMode} from "@/types"

export default function DocumentTypeFilter() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const {data: allDocumentTypes = []} = useGetDocumentTypesQuery()
  const [currentDocumentTypeID, setCurrentDocumentTypeID] = useState<
    string | undefined
  >("")
  const onDocumentTypeChanged = (value: string | null) => {
    let newValue

    if (!value) {
      newValue = undefined
    } else {
      newValue = value
    }

    setCurrentDocumentTypeID(newValue)

    dispatch(
      commanderDocumentTypeIDUpdated({
        mode,
        documentTypeID: newValue
      })
    )
  }

  return (
    <Select
      searchable
      placeholder="Pick Document Type"
      onChange={onDocumentTypeChanged}
      data={allDocumentTypes.map(i => {
        return {value: i.id, label: i.name}
      })}
      value={currentDocumentTypeID}
    />
  )
}
