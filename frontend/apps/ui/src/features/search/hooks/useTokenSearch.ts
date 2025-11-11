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
  const {tokens, addToken, updateToken, removeToken, clearTokens} = useTokens()
  const [hasAutocomplete, setHasAutocomplete] = useState(false)
  const [autocomplete, setAutocomplete] = useState<SearchSuggestion[]>()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
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
      typeHandler: customFieldTypeHandler as CustomFieldDataType,
      suggestionType: suggestionType as SuggestionType
    }

    const {
      hasSuggestions,
      suggestions,
      tokens: parsedTokens,
      isComplete,
      errors
    } = parse(newInputValue, extraData)
    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)

    if (errors.length === 0) {
      setIsInputValid(true)
    }

    if (isComplete && parsedTokens.length > 0) {
      setInputValue("")
      parsedTokens.forEach(t => addToken(t))
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

    setHasAutocomplete(hasSuggestions)
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

  const handleBoxFocus = useCallback(() => {
    setIsFocused(true)
    onFocusChange?.(true)
    setHasAutocomplete(true)
    setAutocomplete([
      {
        type: "filter",
        items: FILTERS.sort()
      }
    ])
    combobox.openDropdown()
  }, [combobox, onFocusChange])

  const handleBoxBlur = useCallback(
    (e: React.FocusEvent) => {
      // Check if the new focus target is still within the search component
      const currentTarget = e.currentTarget
      const relatedTarget = e.relatedTarget as Node

      // If focus is moving to a child element or staying within, don't blur
      if (currentTarget.contains(relatedTarget)) {
        return
      }

      // Focus is leaving the component entirely - collapse it
      setTimeout(() => {
        setIsFocused(false)
        onFocusChange?.(false)
        combobox.closeDropdown()
      }, 150)
    },
    [combobox, onFocusChange]
  )

  const handleBoxClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true)
    setHasAutocomplete(true)
    console.log("handleInputFocus")
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
          parseResult.tokens.forEach(t => addToken(t))

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
          setHasAutocomplete(true)
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

    // Clear autocomplete
    setHasAutocomplete(false)
    setAutocomplete(undefined)

    // Keep focus on the search (don't collapse)
    inputRef.current?.focus()

    // Trigger search callback with empty tokens
    onSearch?.([])
  }, [onSearch])

  return {
    inputValue,
    combobox,
    autocomplete,
    hasAutocomplete,
    isFocused,
    isInputFocused,
    inputRef,
    handleInputChange,
    handleOptionSubmit,
    handleBoxFocus,
    handleBoxBlur,
    handleBoxClick,
    handleClearAll,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    validationError,
    isInputValid,
    lastAddedTokenIndex
  }
}
