import React from "react"
import {Combobox, TextInput, Box} from "@mantine/core"
import {IconTag, IconFolder, IconAdjustments} from "@tabler/icons-react"
import {useTokenSearch} from "@/features/search/hooks/useTokenSearch"
import type {Token} from "@/features/search/types"

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
    suggestions,
    showSuggestions,
    isLoading,
    activeIndex,
    handleInputChange,
    removeToken
  } = useTokenSearch({onSearch})

  const getTokenIcon = (type: Token["type"]) => {
    switch (type) {
      case "tag":
      case "tag_any":
      case "tag_not":
        return <IconTag size={14} />
      case "category":
        return <IconFolder size={14} />
      case "custom_field":
        return <IconAdjustments size={14} />
      default:
        return null
    }
  }

  const getTokenColor = (type: Token["type"]) => {
    switch (type) {
      case "tag":
        return "blue"
      case "tag_any":
        return "cyan"
      case "tag_not":
        return "red"
      case "category":
        return "violet"
      case "custom_field":
        return "grape"
      default:
        return "gray"
    }
  }

  const formatTokenLabel = (token: Token): string => {
    if (token.type === "custom_field") {
      return `${token.name}${token.operator || ""}:${token.value}`
    }
    if (token.type === "fts") {
      return `"${token.value}"`
    }
    if (Array.isArray(token.value)) {
      return `${token.name}:[${token.value.join(", ")}]`
    }
    return `${token.name}:${token.value}`
  }
  return (
    <Combobox store={combobox} withinPortal={false}>
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
            style={{
              flex: 1,
              minWidth: 100,
              backgroundColor: "white", // input white background
              color: "black" // input black text
            }}
          />
        </Box>
      </Combobox.Target>

      <Combobox.Dropdown
        style={{
          backgroundColor: "white", // dropdown white background
          color: "black", // dropdown black text
          border: "1px solid #ccc"
        }}
      >
        <Combobox.Options>
          <Combobox.Option key={1} value={"one"}>
            {"One"}
          </Combobox.Option>
          <Combobox.Option key={2} value={"two"}>
            {"Two"}
          </Combobox.Option>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
