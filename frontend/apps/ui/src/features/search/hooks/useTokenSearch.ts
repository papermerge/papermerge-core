import {FILTERS} from "@/features/search/microcomp/const"
import {parse} from "@/features/search/microcomp/scanner"
import type {SearchSuggestion, Token} from "@/features/search/microcomp/types"
import {autocompleteText} from "@/features/search/microcomp/utils"
import {useCombobox} from "@mantine/core"
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
  const [autocomplete, setAutocomplete] = useState<SearchSuggestion[]>()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [validationError, setValidationError] = useState<string>("")

  const handleOptionSubmit = (val: string) => {
    let newInputValue = autocompleteText(inputValue, val)

    const {suggestions, tokens, errors} = parse({input: newInputValue})
    setAutocomplete(suggestions)

    tokens.forEach(t => addToken(t))

    setInputValue("")

    combobox.resetSelectedOption()
  }

  // Handle input change with real-time validation
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value

    // Clear previous validation error when user types
    setValidationError("")
    const {hasSuggestions, suggestions, tokens} = parse({input})

    setAutocomplete(suggestions)

    if (tokens.length > 0) {
      setInputValue("")
      tokens.forEach(t => addToken(t))
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
        const trimmedValue = inputValue.trim()

        // If input is empty, do nothing
        if (!trimmedValue) {
          return
        }

        const {tokens, errors} = parse({input: trimmedValue, enterKey: true})

        // Check for errors
        if (errors.length > 0) {
          const firstError = errors[0]
          setValidationError(firstError)
          return
        }

        // Success - add tokens and clear input
        if (tokens.length > 0) {
          tokens.forEach(t => addToken(t))

          setInputValue("")
          setValidationError("")
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
    isInputValid: validationError.length == 0
  }
}
