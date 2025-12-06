import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  addRecentCategory,
  selectRecentCategoriesSorted
} from "@/features/document/store/recentCategoriesSlice"
import {
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  type ComboboxItem
} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useCallback, useMemo, useState} from "react"
import {useTranslation} from "react-i18next"

interface DocumentTypeOption {
  id: string
  name: string
}

interface CategorySelectProps {
  /**
   * Available document types/categories to select from
   */
  documentTypes: DocumentTypeOption[]

  /**
   * Currently selected document type ID
   */
  value: string | null

  /**
   * Callback when category changes
   */
  onChange: (value: string | null) => void

  /**
   * Whether the select is disabled
   */
  disabled?: boolean

  /**
   * Optional label override
   */
  label?: string
}

/**
 * Category/Document Type selector with:
 * 1. Confirmation dialog when changing from a non-empty category
 * 2. Recently used categories shown at the top
 *
 * The confirmation is needed because changing category clears all
 * custom field values for the document.
 */
export function CategorySelect({
  documentTypes,
  value,
  onChange,
  disabled = false,
  label
}: CategorySelectProps) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const recentCategories = useAppSelector(selectRecentCategoriesSorted)

  // Confirmation dialog state
  const [confirmOpened, {open: openConfirm, close: closeConfirm}] =
    useDisclosure(false)
  const [pendingValue, setPendingValue] = useState<string | null>(null)

  // Build select options with "Recently Used" group
  const selectOptions = useMemo(() => {
    const options: (ComboboxItem | {group: string; items: ComboboxItem[]})[] =
      []

    // Get IDs of recent categories that still exist in documentTypes
    const validRecentIds = new Set(
      recentCategories
        .filter(rc => documentTypes.some(dt => dt.id === rc.id))
        .map(rc => rc.id)
    )

    // Add "Recently Used" group if we have any valid recent categories
    if (validRecentIds.size > 0) {
      const recentItems = recentCategories
        .filter(rc => validRecentIds.has(rc.id))
        .map(rc => ({
          value: rc.id,
          label: rc.name
        }))

      options.push({
        group: t("category_select.recently_used", {
          defaultValue: "Recently Used"
        }),
        items: recentItems
      })
    }

    // Add all categories, EXCLUDING those already in "Recently Used" to avoid duplicates
    const allCategoryItems = documentTypes
      .filter(dt => !validRecentIds.has(dt.id))
      .map(dt => ({
        value: dt.id,
        label: dt.name
      }))

    if (validRecentIds.size > 0 && allCategoryItems.length > 0) {
      options.push({
        group: t("category_select.all_categories", {
          defaultValue: "All Categories"
        }),
        items: allCategoryItems
      })
    } else if (validRecentIds.size === 0) {
      // If no recent categories, just add all items without grouping
      const allItems = documentTypes.map(dt => ({
        value: dt.id,
        label: dt.name
      }))
      options.push(...allItems)
    }

    return options
  }, [documentTypes, recentCategories, t])

  // Handle select change
  const handleChange = useCallback(
    (newValue: string | null) => {
      // If current value is non-empty and we're changing to something else,
      // show confirmation dialog
      if (value && newValue !== value) {
        setPendingValue(newValue)
        openConfirm()
        return
      }

      // Otherwise, apply the change directly
      applyChange(newValue)
    },
    [value, openConfirm]
  )

  // Apply the category change and track in recent categories
  const applyChange = useCallback(
    (newValue: string | null) => {
      // Track in recently used (only if selecting a category, not clearing)
      if (newValue) {
        const selectedCategory = documentTypes.find(dt => dt.id === newValue)
        if (selectedCategory) {
          dispatch(
            addRecentCategory({
              id: selectedCategory.id,
              name: selectedCategory.name
            })
          )
        }
      }

      onChange(newValue)
    },
    [documentTypes, dispatch, onChange]
  )

  // Handle confirmation dialog actions
  const handleConfirm = useCallback(() => {
    applyChange(pendingValue)
    closeConfirm()
    setPendingValue(null)
  }, [pendingValue, applyChange, closeConfirm])

  const handleCancel = useCallback(() => {
    closeConfirm()
    setPendingValue(null)
  }, [closeConfirm])

  // Get the name of pending category for display in dialog
  const pendingCategoryName = useMemo(() => {
    if (!pendingValue) {
      return t("category_select.none", {defaultValue: "None"})
    }
    const found = documentTypes.find(dt => dt.id === pendingValue)
    return found?.name ?? pendingValue
  }, [pendingValue, documentTypes, t])

  return (
    <>
      <Select
        label={label ?? t("common.category")}
        data={selectOptions}
        value={value}
        placeholder={t("common.pick_value")}
        onChange={handleChange}
        clearable
        searchable
        disabled={disabled}
      />

      {/* Confirmation Modal */}
      <Modal
        opened={confirmOpened}
        onClose={handleCancel}
        title={t("category_select.confirm_title", {
          defaultValue: "Change Category?"
        })}
        centered
      >
        <Stack gap="md">
          <Text>
            {t("category_select.confirm_message", {
              defaultValue:
                "Changing the category will clear all custom field values for this document. This action cannot be undone."
            })}
          </Text>

          <Text size="sm" c="dimmed">
            {t("category_select.new_category", {
              defaultValue: "New category:"
            })}{" "}
            <Text span fw={600}>
              {pendingCategoryName}
            </Text>
          </Text>

          <Divider />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleCancel}>
              {t("common.cancel", {defaultValue: "Cancel"})}
            </Button>
            <Button color="red" onClick={handleConfirm}>
              {t("category_select.confirm_button", {
                defaultValue: "Change Category"
              })}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export default CategorySelect
