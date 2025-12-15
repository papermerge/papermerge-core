// useSelectCustomField.ts
import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/storage/api"
import {selectDocumentCategoryID} from "@/features/documentsList/storage/documentsByCategory"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import {updateFilter} from "@/features/search/storage/search"

interface SelectDataItem {
  value: string
  label: string
  disabled?: boolean
}

export function useSelectCustomField(index: number) {
  const dispatch = useAppDispatch()
  const categoryID = useAppSelector(selectDocumentCategoryID)
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  const {
    data = [],
    isLoading,
    error
  } = useGetCustomFieldsQuery({
    document_type_id: categoryID
  })

  const handleChange = (value: string | null) => {
    const cf = data.find(i => i.id === value)
    if (!cf) {
      dispatch(
        updateFilter({
          index,
          updates: {
            typeHandler: undefined,
            fieldName: undefined,
            config: undefined,
            id: undefined
          }
        })
      )
    }
    dispatch(
      updateFilter({
        index,
        updates: {
          typeHandler: cf.type_handler,
          fieldName: cf.name,
          config: cf.config,
          id: cf.id
        }
      })
    )
  }

  const getSelectData = (): SelectDataItem[] => {
    if (isLoading) {
      return [{value: "loading", label: "Loading...", disabled: true}]
    }

    if (error) {
      return [{value: "error", label: "Error loading items", disabled: true}]
    }

    if (data.length === 0) {
      return [{value: "empty", label: "No items found", disabled: true}]
    }

    return data.map(i => ({value: i.id, label: i.name}))
  }

  return {
    value: filter.id,
    selectData: getSelectData(),
    onChange: handleChange
  }
}
