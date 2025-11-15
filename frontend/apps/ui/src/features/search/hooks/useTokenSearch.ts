import type {CustomFieldType} from "@/features/custom-fields/types"
import {FILTERS} from "@/features/search/microcomp/const"
import {parse} from "@/features/search/microcomp/scanner"
import type {
  SearchSuggestion,
  SuggestionType,
  Token
} from "@/features/search/microcomp/types"
import {autocompleteText} from "@/features/search/microcomp/utils"
import {CustomFieldDataType} from "@/types"
import {ComboboxOptionProps, useCombobox} from "@mantine/core"
import {useCallback, useRef, useState} from "react"
import {useTokens} from "./useTokens"

interface UseTokenSearchProps {
  onSearch?: (tokens: Token[]) => void
  onFocusChange?: (isFocused: boolean) => void
}

export const useTokenSearch = ({
  onSearch,
  onFocusChange
}: UseTokenSearchProps) => {
  const [inputValue, setInputValue] = useState("")
  /** Custom field type currently being typed */
  const [currentCFType, setCurrentCFType] = useState<CustomFieldType>()
  const [currentSuggestionType, setCurrentSuggestionType] =
    useState<SuggestionType>()
  const {tokens, addToken, updateToken, removeToken, clearTokens} = useTokens()
  const [autocomplete, setAutocomplete] = useState<SearchSuggestion[]>()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [validationError, setValidationError] = useState<string>("")
  const [isInputValid, setIsInputValid] = useState(false)
  const [lastAddedTokenIndex, setLastAddedTokenIndex] = useState<number>(-1)

  const handleOptionSubmit = (
    val: string,
    optionProps: ComboboxOptionProps
  ) => {
    const customFieldTypeHandler = (optionProps as any)["data-type-handler"]
    const suggestionType = (optionProps as any)["data-suggestion-type"]

    let newInputValue = autocompleteText(inputValue, val)
    const extraData = {
      typeHandler:
        (customFieldTypeHandler as CustomFieldDataType) || currentCFType,
      suggestionType:
        (suggestionType as SuggestionType) || currentSuggestionType
    }

    if (suggestionType == "customField") {
      newInputValue = newInputValue + ":"
    }
    if (customFieldTypeHandler) {
      // remember cf type
      setCurrentCFType(customFieldTypeHandler)
    }

    if (suggestionType) {
      setCurrentSuggestionType(suggestionType)
    }

    const {
      suggestions,
      tokens: parsedTokens,
      isComplete,
      errors
    } = parse(newInputValue, extraData)
    setAutocomplete(suggestions)

    if (errors.length === 0) {
      setIsInputValid(true)
    }

    if (isComplete && parsedTokens.length > 0) {
      parsedTokens.forEach(t => {
        if (t.type == "cf" && currentCFType) {
          addToken({...t, typeHandler: currentCFType})
        } else {
          addToken(t)
        }
      })
      setCurrentCFType(undefined)
      setInputValue("")
    } else {
      setInputValue(newInputValue)
    }
    combobox.resetSelectedOption()
  }

  // Handle input change with real-time validation
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value

    // Clear previous validation error when user types
    setValidationError("")
    const {
      hasSuggestions,
      suggestions,
      tokens: parsedTokens,
      isComplete,
      errors
    } = parse(input)

    setAutocomplete(suggestions)

    // Real-time validation: check if current input would be valid
    if (input.trim()) {
      const testInput = input + ";"
      const testResult = parse(testInput)
      setIsInputValid(testResult.errors.length === 0)
    } else {
      setIsInputValid(false)
    }

    if (isComplete && parsedTokens.length > 0) {
      setInputValue("")
      parsedTokens.forEach(t => addToken(t))
    } else {
      setInputValue(input)
    }

    if (hasSuggestions) {
      combobox.openDropdown()
    }
  }

  const toggleCompactModeHandler = useCallback(() => {
    const newValue = !isCompactMode
    setIsCompactMode(newValue)

    if (newValue) {
      // if newValue is true == it is now in compact mode
      combobox.closeDropdown()
      setAutocomplete([])
    }
  }, [combobox])

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true)
    setAutocomplete([
      {
        type: "filter",
        items: FILTERS.sort()
      }
    ])
    combobox.openDropdown()
  }, [combobox])

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false)
    combobox.closeDropdown()
  }, [combobox])

  const handleKeyDown = useCallback(
    // KEY == ENTER
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const {key} = event

      // Handle Enter key
      if (key === "Enter") {
        event.preventDefault() // Prevent form submission

        // If input is empty, do nothing
        if (!inputValue.trim()) {
          return
        }

        // Append semicolon and try to parse
        const inputWithSemicolon = inputValue + ";"
        const parseResult = parse(inputWithSemicolon)

        // Check for errors
        if (parseResult.errors.length > 0) {
          const firstError = parseResult.errors[0]
          setValidationError(
            `Error in '${firstError.token || inputValue}': ${firstError.message}`
          )
          return
        }

        // Success - add tokens and clear input
        if (parseResult.tokens.length > 0) {
          const currentTokenCount = tokens.length
          parseResult.tokens.forEach(t => {
            if (t.type == "cf" && currentCFType) {
              addToken({...t, typeHandler: currentCFType})
            } else {
              addToken(t)
            }
          })
          setCurrentCFType(undefined)

          // Mark the last added token for animation
          setLastAddedTokenIndex(
            currentTokenCount + parseResult.tokens.length - 1
          )

          // Clear the animation after 600ms
          setTimeout(() => {
            setLastAddedTokenIndex(-1)
          }, 600)

          setInputValue("")
          setValidationError("")
          setIsInputValid(false)
          setAutocomplete([
            {
              type: "filter",
              items: FILTERS.sort()
            }
          ])
        }
      }
    },
    [inputValue, addToken, tokens.length]
  )

  const handleClearAll = useCallback(() => {
    clearTokens()

    // Clear input value
    setInputValue("")
    setValidationError("")
    setIsInputValid(false)

    setAutocomplete(undefined)

    // Keep focus on the search (don't collapse)
    inputRef.current?.focus()

    // Trigger search callback with empty tokens
    onSearch?.([])
  }, [onSearch])

  const hasAutocomplete = () => {
    if (!autocomplete) {
      return false
    }

    if (autocomplete.length > 0) {
      return true
    }

    return false
  }

  return {
    inputValue,
    combobox,
    autocomplete,
    hasAutocomplete: hasAutocomplete(),
    isCompactMode,
    isFocused,
    isInputFocused,
    inputRef,
    handleInputChange,
    handleOptionSubmit,
    handleClearAll,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    toggleCompactModeHandler,
    validationError,
    isInputValid,
    lastAddedTokenIndex
  }
}
