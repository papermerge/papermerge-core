import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/storage/api"
import {selectDocumentCategoryID} from "@/features/documentsList/storage/documentsByCategory"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import {updateFilter} from "@/features/search/storage/search"
import {Select} from "@mantine/core"

interface Args {
  index: number
}

export default function SelectCustomField({index}: Args) {
  const dispatch = useAppDispatch()
  const categoryID = useAppSelector(selectDocumentCategoryID)
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  const {
    data = [],
    isLoading,
    error
  } = useGetCustomFieldsQuery({document_type_id: categoryID})
  const selectData = data.map(i => {
    return {value: i.id, label: i.name}
  })

  const handleChange = (value: string | null) => {
    const cf = data.find(i => i.id === value)
    if (!cf) {
      console.warn(`filter with ID=${value} not found`)
      return
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

  const renderSelectData = () => {
    if (isLoading) {
      return [
        {
          value: "loading",
          label: "Loading...",
          disabled: true
        }
      ]
    }

    if (error) {
      return [
        {
          value: "error",
          label: "Error loading items",
          disabled: true
        }
      ]
    }

    if (data.length === 0) {
      return [
        {
          value: "empty",
          label: "No items found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <Select
      value={filter.id}
      data={renderSelectData()}
      size="sm"
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      searchable
      clearable
    />
  )
}
