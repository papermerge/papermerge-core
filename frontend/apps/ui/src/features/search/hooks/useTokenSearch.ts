import {useState, useCallback} from "react"
import {useCombobox} from "@mantine/core"
import type {Token, SearchSuggestion} from "@/features/search/microcomp/types"
import {scanSearchText} from "@/features/search/microcomp/scanner"
import {autocompleteText} from "@/features/search/microcomp/utils"
import {FILTERS} from "@/features/search/microcomp/const"

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

    setInputValue(newInputValue)
    const {hasSuggestions, suggestions} = scanSearchText(newInputValue)
    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    combobox.resetSelectedOption()
  }

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const {
      hasSuggestions,
      suggestions,
      tokens: localTokens
    } = scanSearchText(input)

    setHasAutocomplete(hasSuggestions)
    setAutocomplete(suggestions)
    setTokens(localTokens)

    const nonEmptySpaceToken = localTokens.find(token => token.type != "space")
    if (nonEmptySpaceToken) {
      setInputValue("")
      console.log(localTokens)
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
