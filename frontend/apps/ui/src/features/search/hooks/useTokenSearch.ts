import {FILTERS} from "@/features/search/microcomp/const"
import {scanSearchText} from "@/features/search/microcomp/scanner"
import type {SearchSuggestion, Token} from "@/features/search/microcomp/types"
import {autocompleteText} from "@/features/search/microcomp/utils"
import {useCombobox} from "@mantine/core"
import {useCallback, useState} from "react"

interface UseTokenSearchProps {
  onSearch?: (tokens: Token[]) => void
}

export const useTokenSearch = ({onSearch}: UseTokenSearchProps) => {
  const [inputValue, setInputValue] = useState("")
  const [tokens, setTokens] = useState<Token[]>([])
  const [hasAutocomplete, setHasAutocomplete] = useState(false)
  const [autocomplete, setAutocomplete] = useState<SearchSuggestion[]>()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const handleOptionSubmit = (val: string) => {
    let newInputValue = autocompleteText(inputValue, val)

    const {hasSuggestions, suggestions, token, tokenIsComplete} =
      scanSearchText(newInputValue)
    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    if (tokenIsComplete && token && token?.type != "space") {
      setInputValue("")
      setTokens([...tokens, token])
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
      setTokens([...tokens, token])
    } else {
      setInputValue(input)
    }

    if (hasSuggestions) {
      combobox.openDropdown()
    }
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

  const handleOnFocus = () => {
    setHasAutocomplete(true)
    setAutocomplete([
      {
        type: "filter",
        items: FILTERS.sort()
      }
    ])
    combobox.openDropdown()
  }

  return {
    inputValue,
    tokens,
    combobox,
    autocomplete,
    hasAutocomplete,
    handleInputChange,
    handleOptionSubmit,
    removeToken,
    handleOnFocus
  }
}
