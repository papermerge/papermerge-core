import {useState, useCallback} from "react"
import {useCombobox} from "@mantine/core"
import type {Token, SearchSuggestion} from "@/features/search/microcomp/types"
// Use existing tokenParser
import {scanSearchText} from "@/features/search/microcomp/scanner"
import {autocompleteText} from "@/features/search/microcomp/utils"

const TOKEN_NEEDS_COLUMN = ["tag", "any", "all", "not"]

interface UseTokenSearchProps {
  onSearch?: (tokens: Token[]) => void
}

export const useTokenSearch = ({onSearch}: UseTokenSearchProps) => {
  const [inputValue, setInputValue] = useState("")
  const [tokens, setTokens] = useState<Token[]>([])
  const [hasAutocomplete, setHasAutocomplete] = useState(false)
  const [autocomplete, setAutocomplete] = useState<SearchSuggestion[]>()
  const [activeIndex, setActiveIndex] = useState(0)
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const handleOptionSubmit = (val: string) => {
    let newInputValue = autocompleteText(inputValue, val)

    if (TOKEN_NEEDS_COLUMN.includes(val)) {
      newInputValue = `${newInputValue}:`
    } else {
      combobox.closeDropdown()
    }

    setInputValue(newInputValue)
    const {hasSuggestions, suggestions} = scanSearchText(newInputValue)
    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    combobox.resetSelectedOption()
  }

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    setInputValue(input)
    const {
      hasSuggestions,
      suggestions,
      isValid,
      tokens: localTokens
    } = scanSearchText(input)
    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    setTokens(localTokens)
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

  return {
    inputValue,
    tokens,
    combobox,
    autocomplete,
    hasAutocomplete,
    activeIndex,
    handleInputChange,
    handleOptionSubmit,
    removeToken
  }
}
