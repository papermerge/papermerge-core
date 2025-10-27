import {useState, useCallback} from "react"
import type {
  Suggestion,
  ParserState,
  Token,
  CustomFieldType
} from "@/features/search/types"
import {TOKEN_KEYWORDS, OPERATORS_BY_TYPE} from "@/features/search/types"

// Import from existing API slices
import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"

import {useGetTagsQuery} from "@/features/tags/storage/api"
import {useGetCustomFieldsQuery} from "@/features/custom-fields/storage/api"
// Note: We'll need to add this endpoint to document-types API if it doesn't exist

export const useSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // RTK Query hooks - using existing API slices
  const {data: categories = []} = useGetDocumentTypesQuery(undefined) // Returns DocType[]
  const {data: tags = []} = useGetTagsQuery(undefined) // Pass undefined for user's tags
  const {data: allCustomFields = []} = useGetCustomFieldsQuery({
    groupId: undefined
  })

  /**
   * Fetch suggestions based on current input and context
   */
  const fetchSuggestions = useCallback(
    async (
      input: string,
      parserState: ParserState,
      existingTokens: Token[]
    ) => {
      const trimmed = input.trim().toLowerCase()

      // If user is typing a token keyword, show token suggestions
      if (shouldShowTokenSuggestions(trimmed, parserState)) {
        setSuggestions(getTokenSuggestions(trimmed))
        return
      }

      // If expecting operator (for custom field)
      if (parserState.expectingOperator && parserState.currentToken?.name) {
        const customField = allCustomFields.find(
          cf => cf.name === parserState.currentToken!.name
        )
        if (customField) {
          setSuggestions(getOperatorSuggestions(customField.type_handler))
          return
        }
      }

      // If expecting value for category
      if (
        parserState.currentToken?.type === "category" &&
        parserState.expectingValue
      ) {
        setSuggestions(getCategorySuggestions(trimmed, categories))
        return
      }

      // If expecting value for tag
      if (
        (parserState.currentToken?.type === "tag" ||
          parserState.currentToken?.type === "tag_any" ||
          parserState.currentToken?.type === "tag_not") &&
        parserState.expectingValue
      ) {
        setSuggestions(getTagSuggestions(trimmed, tags))
        return
      }

      // If expecting custom field name
      if (
        parserState.currentToken?.type === "custom_field" &&
        !parserState.expectingOperator &&
        !parserState.expectingValue
      ) {
        setIsLoading(true)
        try {
          let fieldsToSearch = allCustomFields

          // If user has selected a category, filter custom fields by that category
          if (parserState.selectedCategory) {
            // Find the document type ID by name
            const selectedDocType = categories.find(
              dt => dt.name === parserState.selectedCategory
            )

            if (selectedDocType) {
              // Use the custom_fields from the document type details
              // This assumes your DocType has a custom_fields property
              fieldsToSearch = selectedDocType.custom_fields || []
            }
          }

          setSuggestions(getCustomFieldSuggestions(trimmed, fieldsToSearch))
        } catch (error) {
          console.error("Error fetching custom fields:", error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
        return
      }

      // Default: show token keyword suggestions if input matches partially
      setSuggestions(getTokenSuggestions(trimmed))
    },
    [categories, tags, allCustomFields]
  )

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
    clearSuggestions
  }
}

/**
 * Check if we should show token keyword suggestions
 */
function shouldShowTokenSuggestions(
  input: string,
  parserState: ParserState
): boolean {
  if (!input) return true
  if (parserState.expectingValue || parserState.expectingOperator) return false

  // Check if input partially matches any token keyword
  for (const keywords of Object.values(TOKEN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (keyword.toLowerCase().startsWith(input)) {
        return true
      }
    }
  }

  return false
}

/**
 * Get token keyword suggestions (tag:, category:, cf:, etc.)
 */
function getTokenSuggestions(input: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const inputLower = input.toLowerCase()

  // Tag tokens
  if ("tag:".startsWith(inputLower) || "tag".startsWith(inputLower)) {
    suggestions.push({
      value: "tag:",
      label: "tag:",
      type: "token",
      description: "Filter by tags (must have all)",
      icon: "🏷️"
    })
  }

  if ("tag_any:".startsWith(inputLower)) {
    suggestions.push({
      value: "tag_any:",
      label: "tag_any:",
      type: "token",
      description: "Filter by tags (must have any)",
      icon: "🏷️"
    })
  }

  if ("tag_not:".startsWith(inputLower)) {
    suggestions.push({
      value: "tag_not:",
      label: "tag_not:",
      type: "token",
      description: "Filter by tags (must not have)",
      icon: "🏷️"
    })
  }

  // Category token
  if (
    "category:".startsWith(inputLower) ||
    "cat:".startsWith(inputLower) ||
    "category".startsWith(inputLower) ||
    "cat".startsWith(inputLower)
  ) {
    suggestions.push({
      value: "category:",
      label: "category:",
      type: "token",
      description: "Filter by document category",
      icon: "📁"
    })
  }

  // Custom field token
  if (
    "cf:".startsWith(inputLower) ||
    "custom_field:".startsWith(inputLower) ||
    "cf".startsWith(inputLower) ||
    "custom".startsWith(inputLower)
  ) {
    suggestions.push({
      value: "cf:",
      label: "cf:",
      type: "token",
      description: "Filter by custom field",
      icon: "⚙️"
    })
  }

  return suggestions
}

/**
 * Get operator suggestions based on field type
 */
function getOperatorSuggestions(fieldType: CustomFieldType): Suggestion[] {
  const operators = OPERATORS_BY_TYPE[fieldType] || []

  return operators.map(op => ({
    value: op,
    label: op,
    type: "operator",
    description: getOperatorDescription(op)
  }))
}

/**
 * Get category value suggestions
 */
function getCategorySuggestions(
  input: string,
  categories: Array<{id: string; name: string}>
): Suggestion[] {
  const inputLower = input.toLowerCase()

  return categories
    .filter(cat => cat.name.toLowerCase().includes(inputLower))
    .map(cat => ({
      value: cat.name,
      label: cat.name,
      type: "category",
      icon: "📁"
    }))
}

/**
 * Get tag value suggestions
 */
function getTagSuggestions(
  input: string,
  tags: Array<{id: string; name: string}>
): Suggestion[] {
  const inputLower = input.toLowerCase()

  return tags
    .filter(tag => tag.name.toLowerCase().includes(inputLower))
    .map(tag => ({
      value: tag.name,
      label: tag.name,
      type: "tag",
      icon: "🏷️"
    }))
}

/**
 * Get custom field name suggestions
 */
function getCustomFieldSuggestions(
  input: string,
  customFields: Array<{
    id: string
    name: string
    type_handler: CustomFieldType
  }>
): Suggestion[] {
  const inputLower = input.toLowerCase()

  return customFields
    .filter(cf => cf.name.toLowerCase().includes(inputLower))
    .map(cf => ({
      value: cf.name,
      label: cf.name,
      type: "custom_field",
      description: `Type: ${cf.type_handler}`,
      icon: "⚙️",
      metadata: {type_handler: cf.type_handler}
    }))
}

/**
 * Get human-readable operator description
 */
function getOperatorDescription(operator: string): string {
  const descriptions: Record<string, string> = {
    "=": "Equals",
    "!=": "Not equals",
    ">": "Greater than",
    ">=": "Greater than or equal",
    "<": "Less than",
    "<=": "Less than or equal",
    contains: "Contains text",
    icontains: "Contains text (case-insensitive)"
  }

  return descriptions[operator] || operator
}
