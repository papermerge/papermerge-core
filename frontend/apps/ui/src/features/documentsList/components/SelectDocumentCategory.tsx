import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetDocumentTypesGroupedQuery} from "@/features/document-types/storage/api"
import {DocTypeGrouped} from "@/features/document-types/types"
import {
  documentCategoryIDUpdated,
  selectDocumentCategoryID
} from "@/features/documentsList/storage/documentsByCategory"
import {Select} from "@mantine/core"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"

export default function SelectDocumentCategory() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const categoryID = useAppSelector(selectDocumentCategoryID)
  const {data: allDocumentTypes = []} = useGetDocumentTypesGroupedQuery()
  const [currentDocumentTypeName, setCurrentDocumentTypeName] = useState<
    string | undefined
  >()

  useEffect(() => {
    if (allDocumentTypes && allDocumentTypes.length > 0) {
      let curName = getDocTypeNameFromID(allDocumentTypes, categoryID)
      setCurrentDocumentTypeName(curName)
    }
  }, [allDocumentTypes.length])

  const onDocumentTypeChanged = (value: string | null) => {
    let newValue
    let document_type_id = getDocTypeIDFromName(allDocumentTypes, value)

    if (!value) {
      newValue = undefined
    } else {
      newValue = value
    }

    setCurrentDocumentTypeName(newValue)
    dispatch(documentCategoryIDUpdated(document_type_id))
    if (newValue) {
      navigate(`/documents/`)
    }
  }

  return (
    <Select
      searchable
      clearable
      placeholder={t("common.pick_value")}
      onChange={onDocumentTypeChanged}
      data={allDocumentTypes.map(g => {
        return {group: g.name, items: g.items.map(i => i.name)}
      })}
      value={currentDocumentTypeName}
    />
  )
}

function getDocTypeIDFromName(
  allDocumentTypes: Array<DocTypeGrouped>,
  name?: string | null
): undefined | string {
  let result: string | undefined

  if (!name) {
    return undefined
  }

  for (let i = 0; i < allDocumentTypes.length; i++) {
    for (let j = 0; j < allDocumentTypes[i].items.length; j++) {
      if (allDocumentTypes[i].items[j].name == name) {
        const grouped_item = allDocumentTypes[i].items[j]
        result = grouped_item.id
      }
    }
  }

  return result
}

function getDocTypeNameFromID(
  allDocumentTypes: Array<DocTypeGrouped>,
  id?: string | null
): undefined | string {
  let result: string | undefined

  if (!id) {
    return undefined
  }

  for (let i = 0; i < allDocumentTypes.length; i++) {
    for (let j = 0; j < allDocumentTypes[i].items.length; j++) {
      if (allDocumentTypes[i].items[j].id == id) {
        const grouped_item = allDocumentTypes[i].items[j]
        result = grouped_item.name
      }
    }
  }

  return result
}
