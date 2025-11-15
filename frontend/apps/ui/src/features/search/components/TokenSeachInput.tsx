import {useAppSelector} from "@/app/hooks"
import ConditionalTooltip from "@/components/ConditionalTooltip"
import {useTokenSearch} from "@/features/search/hooks/useTokenSearch"
import type {Token} from "@/features/search/microcomp/types"
import {
  ActionIcon,
  Box,
  Combobox,
  Group,
  Text,
  TextInput,
  Tooltip
} from "@mantine/core"
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCornerDownLeft,
  IconFilter,
  IconX
} from "@tabler/icons-react"
import {useState} from "react"
import AutocompleteOptions from "./AutocompleteOptions"
import SearchTokens from "./SearchTokens/SearchTokens"
import styles from "./TokenSearchInput.module.css"

interface Args {
  onSearch?: (tokens: Token[]) => void
  onFocusChange?: (isFocused: boolean) => void
  placeholder?: string
}

export default function Search({
  onSearch,
  onFocusChange,
  placeholder = "Search documents... (try: tag:, category:, cf:)"
}: Args) {
  const tokens = useAppSelector(state => state.search.tokens)
  const [isHovering, setIsHovering] = useState(false)
  const {
    combobox,
    inputValue,
    autocomplete,
    isFocused,
    isCompactMode,
    isInputFocused,
    inputRef,
    handleInputChange,
    handleOptionSubmit,
    handleBoxFocus,
    handleBoxClick,
    handleClearAll,
    handleInputFocus,
    toggleCompactModeHandler,
    handleKeyDown,
    validationError,
    isInputValid
  } = useTokenSearch({onSearch, onFocusChange})

  const suggestions = <AutocompleteOptions suggestions={autocomplete} />
  const hasTokens = tokens.length > 0

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
        <Box
          style={getContainerStyles({hasTokens, isFocused})}
          tabIndex={0}
          onFocus={handleBoxFocus}
          onClick={handleBoxClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {isCompactMode && (
            <SearchFiltersCompactSummary
              toggleCompactModeHandler={toggleCompactModeHandler}
              tokensCount={tokens.length}
              isHovering={isHovering}
              showClearButton={showClearButton}
              handleClearAll={handleClearAll}
            />
          )}
          {!isCompactMode && (
            <>
              <SearchTokens />
              <Group className={styles.inputWrapper}>
                <ConditionalTooltip
                  showTooltipIf={validationError.length > 0}
                  tooltipProps={{
                    label: `⚠️ ${validationError}`,
                    withArrow: true,
                    opened: true,
                    position: "top-start",
                    arrowOffset: 5,
                    arrowSize: 7
                  }}
                >
                  <TextInput
                    ref={inputRef}
                    variant="unstyled"
                    placeholder="Search..."
                    value={inputValue}
                    onFocus={handleInputFocus}
                    onChange={event => {
                      handleInputChange(event)
                    }}
                    onKeyDown={handleKeyDown}
                    className={styles.inputField}
                    classNames={{
                      input: validationError ? styles.inputError : undefined
                    }}
                  />
                </ConditionalTooltip>
                {isInputValid && <EnterKeyButton onClick={handleSubmitClick} />}
              </Group>
              <ToggleCompactModeButton onClick={toggleCompactModeHandler} />
              {showClearButton && (
                <ClearButton onClick={handleClearAll} tooltip="Clear all" />
              )}
            </>
          )}
        </Box>
      </Combobox.Target>

      {showSuggestions && <Combobox.Dropdown>{suggestions}</Combobox.Dropdown>}
    </Combobox>
  )
}

interface SearchFiltersCompactSummaryArgs {
  tokensCount: number
  showClearButton: boolean
  handleClearAll: () => void
  isHovering: boolean
  toggleCompactModeHandler: () => void
}

function SearchFiltersCompactSummary({
  isHovering,
  showClearButton,
  handleClearAll,
  toggleCompactModeHandler,
  tokensCount
}: SearchFiltersCompactSummaryArgs) {
  return (
    <Group justify="space-between" w="100%">
      <SearchCompactSummary tokensCount={tokensCount} isHovering={isHovering} />
      <Group>
        <ToggleCompactModeButton
          isCompactMode={true}
          onClick={toggleCompactModeHandler}
        />
        {showClearButton && (
          <ClearButton onClick={handleClearAll} tooltip="Clear all filters" />
        )}
      </Group>
    </Group>
  )
}

interface GetContainerStylesArgs {
  isFocused: boolean
  hasTokens: boolean
}

function getContainerStyles({hasTokens, isFocused}: GetContainerStylesArgs) {
  const baseStyles = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "white",
    color: "black",
    zIndex: 100,
    transition: "all 0.2s ease"
  }

  if (isFocused) {
    // EXPANDED STATE - When user is actively searching
    return {
      ...baseStyles,
      flexWrap: "wrap" as const,
      minHeight: "42px",
      maxHeight: "300px",
      overflowY: "auto" as const,
      overflowX: "hidden" as const,
      boxShadow: hasTokens
        ? "0 4px 12px rgba(0, 0, 0, 0.15)"
        : "0 2px 6px rgba(0, 0, 0, 0.1)"
    }
  } else {
    // COLLAPSED STATE - Compact view when not focused
    return {
      ...baseStyles,
      flexWrap: "nowrap" as const,
      height: "42px", // Fixed single line
      maxHeight: "42px",
      overflow: "hidden" as const, // Hide all overflow
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)"
    }
  }
}

interface SearchCompactSummaryArgs {
  tokensCount: number
  isHovering: boolean
}

function SearchCompactSummary({
  tokensCount,
  isHovering
}: SearchCompactSummaryArgs) {
  return (
    <Text
      size="sm"
      c="dimmed"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        transition: "all 0.2s ease",
        color: isHovering ? "#1971c2" : undefined // Darker blue on hover
      }}
    >
      <IconFilter size={16} color={isHovering ? "#1971c2" : "#228be6"} />
      <span
        style={{
          fontWeight: 500,
          color: isHovering ? "#1971c2" : "#228be6"
        }}
      >
        {tokensCount} active {tokensCount === 1 ? "filter" : "filters"}
      </span>
    </Text>
  )
}

interface ClearButtonArgs {
  onClick: () => void
  tooltip?: string
}

function ClearButton({onClick, tooltip = "Clear all"}: ClearButtonArgs) {
  const [isHovering, setIsHovering] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering box focus
    onClick()
  }

  return (
    <Tooltip label={tooltip} position="bottom" withArrow>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          flexShrink: 0, // Don't let button shrink
          transition: "color 0.2s ease",
          marginLeft: "auto"
        }}
      >
        <IconX
          size={16}
          style={{
            color: isHovering ? "#fa5252" : "#868e96", // Red on hover, gray default
            transition: "color 0.2s ease"
          }}
        />
      </ActionIcon>
    </Tooltip>
  )
}

interface ToggleCompactModeButtonArgs {
  onClick: () => void
  tooltip?: string
  isCompactMode?: boolean
}

function ToggleCompactModeButton({
  onClick,
  tooltip = "Show only summary",
  isCompactMode = false
}: ToggleCompactModeButtonArgs) {
  const [isHovering, setIsHovering] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering box focus
    onClick()
  }

  const iconStyles = {
    color: isHovering ? "#00aeffff" : "#7ab6f2ff", // Red on hover, gray default
    transition: "color 0.2s ease"
  }

  return (
    <Tooltip label={tooltip} position="bottom" withArrow>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          flexShrink: 0, // Don't let button shrink
          transition: "color 0.2s ease",
          marginLeft: "auto"
        }}
      >
        {isCompactMode && <IconArrowsMaximize size={16} style={iconStyles} />}
        {!isCompactMode && <IconArrowsMinimize size={16} style={iconStyles} />}
      </ActionIcon>
    </Tooltip>
  )
}

interface EnterKeyButtonArgs {
  onClick: () => void
}

function EnterKeyButton({onClick}: EnterKeyButtonArgs) {
  return (
    <ActionIcon onClick={onClick} variant="default">
      <IconCornerDownLeft size={16} />
    </ActionIcon>
  )
}
