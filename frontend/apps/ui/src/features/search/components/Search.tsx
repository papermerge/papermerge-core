import {useAppSelector} from "@/app/hooks"
import {useTokenSearch} from "@/features/search/hooks/useTokenSearch"
import type {Token} from "@/features/search/microcomp/types"
import {Box, Combobox} from "@mantine/core"

import SearchFiltersCompactSummary from "./SearchFiltersCompactSummary"
import ClearButton from "./SearchFiltersCompactSummary/ClearButon"
import ToggleCompactModeButton from "./ToggleCompactModeButton"

import AutocompleteOptions from "./AutocompleteOptions"
import styles from "./Search.module.css"
import SearchInput from "./SearchInput"
import SearchTokens from "./SearchTokens/SearchTokens"

interface Args {
  onSearch?: (tokens: Token[]) => void
  onFocusChange?: (isFocused: boolean) => void
}

export default function Search({onSearch, onFocusChange}: Args) {
  const tokens = useAppSelector(state => state.search.tokens)

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
  } = useTokenSearch({onSearch, onFocusChange})

  const suggestions = <AutocompleteOptions suggestions={autocomplete} />

  const shouldShowClearButton = () => {
    return tokens.length > 0 || inputValue.length > 0
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

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
      <Combobox.Target>
        <Box className={styles.searchBox}>
          {isCompactMode && (
            <SearchFiltersCompactSummary
              toggleCompactModeHandler={toggleCompactModeHandler}
              tokensCount={tokens.length}
              showClearButton={showClearButton}
              handleClearAll={handleClearAll}
            />
          )}
          {!isCompactMode && (
            <>
              <SearchTokens />
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
              {tokens.length > 0 && (
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
