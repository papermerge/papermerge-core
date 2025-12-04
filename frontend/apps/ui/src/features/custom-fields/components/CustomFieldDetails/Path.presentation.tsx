import {Breadcrumbs, Group, Loader} from "@mantine/core"
import {Link} from "react-router-dom"
import type {PathProps} from "./types"

/**
 * Presentation component for breadcrumb navigation
 *
 * Renders clickable links in main panel, plain text in secondary panel
 */
export function PathPresentation({
  customFieldName,
  customFieldId,
  panelId,
  isNavigating,
  t
}: PathProps) {
  const customFieldsLabel = t("customFieldDetails.name", {
    defaultValue: "Custom Fields"
  })

  if (panelId === "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/custom-fields/">{customFieldsLabel}</Link>
          <Link to={`/custom-fields/${customFieldId}`}>{customFieldName}</Link>
        </Breadcrumbs>
        {isNavigating && <Loader size="sm" />}
      </Group>
    )
  }

  return (
    <Group>
      <Breadcrumbs>
        <div>{customFieldsLabel}</div>
        <div>{customFieldName}</div>
      </Breadcrumbs>
      {isNavigating && <Loader size="sm" />}
    </Group>
  )
}

export default PathPresentation
