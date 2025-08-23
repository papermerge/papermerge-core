import {Stack} from "@mantine/core"
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
    <div className={`filters-collapse ${className}`} style={styles.container}>
      <div style={styles.header} onClick={toggleExpanded}>
        <IconChevronDown
          size={20}
          style={{
            ...styles.icon,
            transform: expanded ? "rotate(0deg)" : "rotate(90deg)"
          }}
        />
      </div>

      {expanded && <Stack>{filterComponents}</Stack>}
    </div>
  )
}

const styles: {[key: string]: React.CSSProperties} = {
  container: {
    width: "100%",
    border: "1px solid #e0e0e0",
    backgroundColor: "#ffffff",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 4px",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    cursor: "pointer",
    borderBottom: "1px solid #e0e0e0",
    transition: "background-color 0.2s ease"
  },
  icon: {
    transition: "transform 0.2s ease-in-out",
    color: "#666666"
  },
  content: {
    overflow: "hidden",
    transition:
      "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out",
    backgroundColor: "#ffffff"
  }
}
