import {useAppSelector} from "@/app/hooks"
import {useFilterSearch} from "@/features/search/hooks/useTokenSearch"
import {Box, Combobox} from "@mantine/core"

import SearchFiltersCompactSummary from "./SearchFiltersCompactSummary"
import ClearButton from "./SearchFiltersCompactSummary/ClearButon"
import ToggleCompactModeButton from "./ToggleCompactModeButton"

import {useEffect} from "react"
import useDebouncedSearchParamsString from "../hooks/useDebouncedSearchParamsString"
import AutocompleteOptions from "./AutocompleteOptions"
import styles from "./Search.module.css"
import SearchFilters from "./SearchFilters"
import SearchInput from "./SearchInput"

interface Args {
  onSearch?: () => void
}

export default function Search({onSearch}: Args) {
  const filters = useAppSelector(state => state.search.filters)

  const {
    combobox,
    inputValue,
    autocomplete,
    isCompactMode,
    isInputFocused,
    inputRef,
    handleInputChange,
    handleOptionSubmit,
    handleClearAll,
    handleInputFocus,
    handleInputBlur,
    toggleCompactModeHandler,
    handleKeyDown,
    validationError,
    isInputValid
  } = useFilterSearch()
  const {relevantParamsString, filtersCount} = useDebouncedSearchParamsString()

  const suggestions = <AutocompleteOptions suggestions={autocomplete} />

  const shouldShowClearButton = () => {
    return filters.length > 0 || inputValue.length > 0
  }
  const showClearButton = shouldShowClearButton()

  const showSuggestions =
    autocomplete &&
    autocomplete.length > 0 &&
    isInputFocused &&
    validationError.length == 0

  const handleSubmitClick = () => {
    if (inputRef.current) {
      // Create and dispatch a synthetic Enter key event
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      })
      inputRef.current.dispatchEvent(enterEvent)
    }
  }

  useEffect(() => {
    if (filtersCount > 0) {
      onSearch?.()
    }
  }, [relevantParamsString])

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
      <Combobox.Target>
        <Box className={styles.searchBox}>
          {isCompactMode && (
            <SearchFiltersCompactSummary
              toggleCompactModeHandler={toggleCompactModeHandler}
              tokensCount={filters.length}
              showClearButton={showClearButton}
              handleClearAll={handleClearAll}
            />
          )}
          {!isCompactMode && (
            <>
              <SearchFilters />
              <SearchInput
                inputRef={inputRef}
                validationError={validationError}
                isInputValid={isInputValid}
                inputValue={inputValue}
                handleInputBlur={handleInputBlur}
                handleInputFocus={handleInputFocus}
                handleInputChange={handleInputChange}
                handleSubmitClick={handleSubmitClick}
                handleKeyDown={handleKeyDown}
              />
              {filters.length > 0 && (
                <ToggleCompactModeButton onClick={toggleCompactModeHandler} />
              )}
              {showClearButton && <ClearButton onClick={handleClearAll} />}
            </>
          )}
        </Box>
      </Combobox.Target>

      {showSuggestions && <Combobox.Dropdown>{suggestions}</Combobox.Dropdown>}
    </Combobox>
  )
}
