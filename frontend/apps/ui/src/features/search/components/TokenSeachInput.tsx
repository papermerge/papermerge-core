import {useTokenSearch} from "@/features/search/hooks/useTokenSearch"
import type {Token} from "@/features/search/microcomp/types"
import {
  ActionIcon,
  Box,
  Combobox,
  Text,
  TextInput,
  Tooltip
} from "@mantine/core"
import {IconFilter, IconX} from "@tabler/icons-react"
import {useState} from "react"
import AutocompleteOptions from "./AutocompleteOptions"
import SearchTokens from "./SearchTokens/SearchTokens"

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
  const [isHovering, setIsHovering] = useState(false)
  const {
    combobox,
    inputValue,
    tokens,
    autocomplete,
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
    removeToken
  } = useTokenSearch({onSearch, onFocusChange})

  const suggestions = <AutocompleteOptions suggestions={autocomplete} />
  const hasTokens = tokens.length > 0

  const shouldShowCompactSummary = () => {
    return !isFocused && tokens.length > 1
  }

  const shouldShowClearButton = () => {
    return tokens.length > 0 || inputValue.length > 0
  }

  const showCompactSummary = shouldShowCompactSummary()

  const showClearButton = shouldShowClearButton()

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
      <Combobox.Target>
        <Box
          style={getContainerStyles({hasTokens, isFocused})}
          tabIndex={0}
          onFocus={handleBoxFocus}
          onBlur={handleBoxBlur}
          onClick={handleBoxClick}
          onMouseEnter={() => setIsHovering(true)} // ADD
          onMouseLeave={() => setIsHovering(false)} // ADD
        >
          {showCompactSummary ? (
            <>
              {/* Compact mode: Summary text + Clear button */}
              <SearchCompactSummary
                tokensCount={tokens.length}
                isHovering={isHovering}
              />
              {showClearButton && (
                <ClearButton
                  onClick={handleClearAll}
                  tooltip="Clear all filters"
                />
              )}
            </>
          ) : (
            <>
              <SearchTokens items={tokens} />
              <TextInput
                ref={inputRef}
                variant="unstyled"
                placeholder="Search..."
                value={inputValue}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onChange={event => {
                  handleInputChange(event)
                }}
                style={{
                  flex: 1,
                  minWidth: 100,
                  backgroundColor: "white", // input white background
                  color: "black" // input black text
                }}
              />
              {showClearButton && (
                <ClearButton onClick={handleClearAll} tooltip="Clear all" />
              )}
            </>
          )}
        </Box>
      </Combobox.Target>

      {autocomplete && isInputFocused && (
        <Combobox.Dropdown>{suggestions}</Combobox.Dropdown>
      )}
    </Combobox>
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
      <span>·</span>
      <span style={{fontSize: "0.85rem"}}>
        {isHovering ? "Click here" : "Click to expand"}
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
