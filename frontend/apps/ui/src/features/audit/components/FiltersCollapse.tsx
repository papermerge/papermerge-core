import {Box, Paper, Stack, UnstyledButton} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"
import React, {useState} from "react"
import {DropdownConfig} from "../types"
import OperationFilter from "./OperationFilter"
import TableNameFilter from "./TableNameFilter"
import TimestampFilter from "./TimestampFilter"
import UserFilter from "./UserFilter"

interface Args {
  filters: DropdownConfig[]
  className?: string
}

export default function FiltersCollapse({filters, className}: Args) {
  const [expanded, setExpanded] = useState(true)

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  let filterComponents: React.ReactElement[] = []

  if (filters.length == 0) {
    return <></>
  }

  filters.forEach(f => {
    if (f.visible) {
      switch (f.key) {
        case "timestamp":
          filterComponents.push(<TimestampFilter key={f.key} />)
          break
        case "operation":
          filterComponents.push(<OperationFilter key={f.key} />)
          break
        case "table_name":
          filterComponents.push(<TableNameFilter key={f.key} />)
          break
        case "user":
          filterComponents.push(<UserFilter key={f.key} />)
          break
      }
    }
  })

  return (
    <Paper
      className={`filters-collapse ${className}`}
      withBorder
      radius="sm"
      style={{overflow: "hidden"}}
    >
      <UnstyledButton onClick={toggleExpanded} w="100%" p="xs">
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start"
          }}
        >
          <IconChevronDown
            size={20}
            style={{
              transform: expanded ? "rotate(0deg)" : "rotate(90deg)",
              transition: "transform 0.2s ease-in-out"
            }}
          />
        </Box>
      </UnstyledButton>

      {expanded && (
        <Box p="sm">
          <Stack gap="sm">{filterComponents}</Stack>
        </Box>
      )}
    </Paper>
  )
}
