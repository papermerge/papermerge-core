import React from "react"
import {Combobox, TextInput, Box} from "@mantine/core"
import {useTokenSearch} from "@/features/search/hooks/useTokenSearch"
import type {Token} from "@/features/search/microcomp/types"
import AutocompleteOptions from "./AutocompleteOptions"

interface Args {
  onSearch?: (tokens: Token[]) => void
  placeholder?: string
}

export default function Search({
  onSearch,
  placeholder = "Search documents... (try: tag:, category:, cf:)"
}: Args) {
  const {
    combobox,
    inputValue,
    tokens,
    autocomplete,
    hasAutocomplete,
    activeIndex,
    handleInputChange,
    handleOptionSubmit,
    handleOnFocus,
    removeToken
  } = useTokenSearch({onSearch})

  const suggestions = <AutocompleteOptions suggestions={autocomplete} />

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
      <Combobox.Target>
        <Box
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "4px 8px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
            backgroundColor: "white", // white background
            color: "black" // black text
          }}
        >
          <TextInput
            variant="unstyled"
            placeholder="Search..."
            value={inputValue}
            onChange={event => {
              handleInputChange(event)
            }}
            onFocus={handleOnFocus}
            style={{
              flex: 1,
              minWidth: 100,
              backgroundColor: "white", // input white background
              color: "black" // input black text
            }}
          />
        </Box>
      </Combobox.Target>

      {autocomplete && (
        <Combobox.Dropdown>
          <Combobox.Options mah={300} style={{overflowY: "auto"}}>
            {suggestions}
          </Combobox.Options>
        </Combobox.Dropdown>
      )}
    </Combobox>
  )
}
