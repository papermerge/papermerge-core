import {Box, Group, Paper, UnstyledButton} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"
import React, {forwardRef, useState} from "react"
import type {AuditLogQueryParams} from "../types"
import {DropdownConfig} from "../types"
import OperationFilter from "./OperationFilter"
import TableNameFilter from "./TableNameFilter"
import TimestampFilter from "./TimestampFilter"
import UserFilter from "./UserFilter"

interface Args {
  filters: DropdownConfig[]
  className?: string
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

const FiltersCollapse = forwardRef<HTMLDivElement, Args>(
  ({filters, className, setQueryParams}, ref) => {
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
            filterComponents.push(
              <TimestampFilter key={f.key} setQueryParams={setQueryParams} />
            )
            break
          case "operation":
            filterComponents.push(
              <OperationFilter key={f.key} setQueryParams={setQueryParams} />
            )
            break
          case "table_name":
            filterComponents.push(
              <TableNameFilter key={f.key} setQueryParams={setQueryParams} />
            )
            break
          case "user":
            filterComponents.push(<UserFilter key={f.key} />)
            break
        }
      }
    })

    return (
      <Paper
        ref={ref}
        className={`filters-collapse ${className}`}
        withBorder
        radius={"xs"}
        style={{overflow: "hidden"}}
      >
        <UnstyledButton
          onClick={toggleExpanded}
          w="100%"
          p="xs"
          style={{
            outline: "none",
            boxShadow: "none",
            "&:focus": {
              outline: "none",
              boxShadow: "none"
            },
            "&:active": {
              outline: "none",
              boxShadow: "none"
            }
          }}
        >
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
            <Group align={"baseline"} gap="sm">
              {filterComponents}
            </Group>
          </Box>
        )}
      </Paper>
    )
  }
)

export default FiltersCollapse
