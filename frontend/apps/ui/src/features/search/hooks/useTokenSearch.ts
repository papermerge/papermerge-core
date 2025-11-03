import {FILTERS} from "@/features/search/microcomp/const"
import {scanSearchText} from "@/features/search/microcomp/scanner"
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
  const [hasAutocomplete, setHasAutocomplete] = useState(false)
  const [autocomplete, setAutocomplete] = useState<SearchSuggestion[]>()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOptionSubmit = (val: string) => {
    let newInputValue = autocompleteText(inputValue, val)

    const {hasSuggestions, suggestions, token, tokenIsComplete} =
      scanSearchText(newInputValue)
    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    if (tokenIsComplete && token && token?.type != "space") {
      setInputValue("")
      addToken(token)
    } else {
      setInputValue(newInputValue)
    }
    combobox.resetSelectedOption()
  }

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const {hasSuggestions, suggestions, token, tokenIsComplete} =
      scanSearchText(input)

    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    if (tokenIsComplete && token && token?.type != "space") {
      setInputValue("")
      addToken(token)
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
    // Close dropdown when input loses focus
    console.log("handleInputBlur")
    combobox.closeDropdown()
  }, [combobox])

  const handleClearAll = useCallback(() => {
    clearTokens()

    // Clear input value
    setInputValue("")

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
    handleInputBlur
  }
}
