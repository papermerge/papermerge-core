import {useState, useCallback} from "react"
import {useCombobox} from "@mantine/core"
import type {Token, Suggestion, ParserState} from "@/features/search/types"
// Use existing tokenParser
import {useSuggestions} from "@/features/search/hooks/useSuggestions"
import {getKnownTokenWithColumn} from "@/features/search/utils"

const getLastWord = (text: string) => {
  const parts = text.trim().split(/\s+/)
  return parts[parts.length - 1] ?? ""
}

interface UseTokenSearchProps {
  onSearch?: (tokens: Token[]) => void
}

export const useTokenSearch = ({onSearch}: UseTokenSearchProps) => {
  const [inputValue, setInputValue] = useState("")
  const [tokens, setTokens] = useState<Token[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const {suggestions, isLoading, fetchSuggestions, clearSuggestions} =
    useSuggestions()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  // Get current parser context for autocomplete
  const getCurrentContext = (
    input: string,
    existingTokens: Token[]
  ): ParserState => {
    // Simple context detection - you can enhance this based on your needs
    const trimmed = input.trim().toLowerCase()

    // Find if user has selected a category for custom field filtering
    const selectedCategory = existingTokens.find(t => t.type === "category")
      ?.value as string | undefined

    // Check if user is typing a token keyword
    if (trimmed === "cf:" || trimmed === "custom_field:") {
      return {
        currentToken: {type: "custom_field", name: ""},
        expectingValue: false,
        expectingOperator: false,
        selectedCategory
      }
    }

    if (trimmed === "category:" || trimmed === "cat:") {
      return {
        currentToken: {type: "category", name: "category"},
        expectingValue: true,
        expectingOperator: false,
        selectedCategory
      }
    }

    if (
      trimmed === "tag:" ||
      trimmed === "tag_any:" ||
      trimmed === "tag_not:"
    ) {
      return {
        currentToken: {
          type: trimmed.replace(":", "") as any,
          name: trimmed.replace(":", "")
        },
        expectingValue: true,
        expectingOperator: false,
        selectedCategory
      }
    }

    return {
      expectingValue: false,
      expectingOperator: false,
      selectedCategory
    }
  }

  const parserState = getCurrentContext(inputValue, tokens)

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value)
    setActiveIndex(0)
    console.log(value)

    const lastWord = getLastWord(value.trim())
    console.log(lastWord)
    const knownTokenWithColumn = getKnownTokenWithColumn(lastWord)
    console.log(knownTokenWithColumn)
  }

  // Remove token by index
  const removeToken = useCallback(
    (index: number) => {
      const newTokens = tokens.filter((_, i) => i !== index)
      setTokens(newTokens)
      onSearch?.(newTokens)
    },
    [tokens, onSearch]
  )

  return {
    inputValue,
    tokens,
    combobox,
    suggestions,
    showSuggestions,
    isLoading,
    activeIndex,
    handleInputChange,
    removeToken
  }
}

/**
 * Apply a suggestion to current state
 */
function applysuggestion(
  suggestion: Suggestion,
  currentInput: string,
  currentTokens: Token[],
  parserState: ParserState
): {
  inputValue: string
  tokens: Token[]
  showSuggestions: boolean
} {
  switch (suggestion.type) {
    case "token":
      // User selected a token keyword (e.g., "tag:", "cf:")
      return {
        inputValue: suggestion.value,
        tokens: currentTokens,
        showSuggestions: true // Keep open to show next suggestions
      }

    case "custom_field":
      // User selected a custom field name
      if (parserState.currentToken?.type === "custom_field") {
        return {
          inputValue: `cf:"${suggestion.label}"`,
          tokens: currentTokens,
          showSuggestions: true // Show operators next
        }
      }
      break

    case "operator":
      // User selected an operator
      if (parserState.currentToken?.type === "custom_field") {
        const fieldName = parserState.currentToken.name
        return {
          inputValue: `cf:"${fieldName}"${suggestion.value}`,
          tokens: currentTokens,
          showSuggestions: false // Wait for value input
        }
      }
      break

    case "category":
    case "tag":
      // User selected a category or tag value
      const tokenType = suggestion.type === "category" ? "category" : "tag"
      const newToken: Token = {
        type: tokenType,
        name: tokenType,
        value: suggestion.value,
        raw: `${tokenType}:"${suggestion.label}"`
      }

      return {
        inputValue: "",
        tokens: [...currentTokens, newToken],
        showSuggestions: false
      }

    case "value":
      // User selected a value for current token
      if (parserState.currentToken) {
        const completedToken: Token = {
          ...parserState.currentToken,
          value: suggestion.value
        } as Token

        return {
          inputValue: "",
          tokens: [...currentTokens, completedToken],
          showSuggestions: false
        }
      }
      break
  }

  // Default: just replace input
  return {
    inputValue: suggestion.value,
    tokens: currentTokens,
    showSuggestions: true
  }
}
