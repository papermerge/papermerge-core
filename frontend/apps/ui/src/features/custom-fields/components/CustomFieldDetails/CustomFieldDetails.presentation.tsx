import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import LoadingPanel from "@/components/LoadingPanel"
import {Group, LoadingOverlay, Paper, Stack} from "@mantine/core"
import {CopyableTextInput} from "kommon"
import {useTranslation} from "react-i18next"
import {useNavigation} from "react-router-dom"
import {DeleteCustomFieldButton} from "../DeleteButton"
import EditButton from "../EditButton"
import {CustomFieldFormContainer} from "./CustomFieldForm.container"
import {PathPresentation} from "./Path.presentation"
import type {CustomFieldDetailsProps} from "./types"

/**
 * Presentation component for CustomFieldDetails
 *
 * Displays:
 * - Breadcrumb navigation
 * - Action buttons (Edit, Delete, Close)
 * - Custom field form (readonly)
 * - Audit information (created/updated timestamps and users)
 */
export function CustomFieldDetailsPresentation({
  customField,
  isLoading,
  isFetching,
  hasError,
  formattedUpdatedAt,
  formattedCreatedAt,
  updatedByUsername,
  createdByUsername,
  canDelete,
  canUpdate,
  panelId,
  onClose
}: CustomFieldDetailsProps) {
  const {t} = useTranslation()
  const navigation = useNavigation()

  if (isLoading) {
    return <LoadingPanel />
  }

  if (hasError) {
    return <div>Error loading custom field details</div>
  }

  if (!customField) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        {/* Header with breadcrumbs and action buttons */}
        <Group justify="space-between" style={{flexShrink: 0}}>
          <PathPresentation
            customFieldName={customField.name}
            customFieldId={customField.id}
            panelId={panelId}
            isNavigating={navigation.state === "loading"}
            t={t}
          />
          <Group>
            {canDelete && (
              <DeleteCustomFieldButton customFieldId={customField.id} />
            )}
            {canUpdate && <EditButton customFieldId={customField.id} />}
            <CloseSecondaryPanel onClick={onClose} />
          </Group>
        </Group>

        {/* Scrollable content */}
        <Stack style={{overflowY: "auto"}}>
          {/* Custom field form */}
          <CustomFieldFormContainer
            key={customField.id}
            customField={customField}
            t={t}
          />

          {/* Audit information */}
          <CopyableTextInput
            value={formattedUpdatedAt}
            label={t("updated_at", {defaultValue: "Updated at"})}
          />
          <CopyableTextInput
            value={updatedByUsername}
            label={t("updated_by", {defaultValue: "Updated by"})}
          />
          <CopyableTextInput
            value={formattedCreatedAt}
            label={t("created_at", {defaultValue: "Created at"})}
          />
          <CopyableTextInput
            value={createdByUsername}
            label={t("created_by", {defaultValue: "Created by"})}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

export default CustomFieldDetailsPresentation
