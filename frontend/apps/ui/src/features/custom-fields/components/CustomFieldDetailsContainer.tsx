import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetCustomFieldQuery} from "@/features/custom-fields/storage/api"
import {selectCustomFieldDetailsID} from "@/features/custom-fields/storage/custom_field"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanelMode} from "@/hooks"
import type {PanelMode} from "@/types"
import type {CustomFieldDetails} from "@/types.d/customFields"
import {
  Breadcrumbs,
  Group,
  Loader,
  LoadingOverlay,
  Paper,
  Stack
} from "@mantine/core"
import {CopyableTextInput} from "kommon"
import {Link, useNavigation} from "react-router-dom"
import CustomFieldForm from "./CustomFieldForm"
import {DeleteCustomFieldButton} from "./DeleteButton"
import EditButton from "./EditButton"

import LoadingPanel from "@/components/LoadingPanel"
import {useTranslation} from "react-i18next"

export default function CustomFieldDetailsContainer() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const customFieldID = useAppSelector(s => selectCustomFieldDetailsID(s, mode))
  const {data, isLoading, isFetching, error} = useGetCustomFieldQuery(
    customFieldID || "",
    {
      skip: !customFieldID
    }
  )

  if (isLoading) return <LoadingPanel />
  if (error) return <div>Error loading customField details</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%", overflow: "hidden"}}>
        <Group justify="space-between" style={{flexShrink: 0}}>
          <Path customField={data} mode={mode} />
          <Group>
            <DeleteCustomFieldButton customFieldId={data.id} />
            <EditButton customFieldId={data.id} />
            <CloseSecondaryPanel
              onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
            />
          </Group>
        </Group>
        <Stack style={{overflowY: "auto"}}>
          <CustomFieldForm key={data.id} customField={data} />

          <CopyableTextInput
            value={data.updated_at}
            label={t?.("updated_at", {defaultValue: "Updated at"})}
          />
          <CopyableTextInput
            value={data.updated_by?.username}
            label={t?.("updated_by", {defaultValue: "Updated by"})}
          />
          <CopyableTextInput
            value={data.created_at}
            label={t?.("created_at", {defaultValue: "Created at"})}
          />
          <CopyableTextInput
            value={data.created_by.username}
            label={t?.("created_by", {defaultValue: "Created by"})}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

function Path({
  customField,
  mode
}: {
  customField: CustomFieldDetails | null
  mode: PanelMode
}) {
  const navigation = useNavigation()
  const {t} = useTranslation()

  if (mode == "main") {
    return (
      <Group>
        <Breadcrumbs>
          <Link to="/custom-fields/">
            {t("customFieldDetails.name", {defaultValue: "Custom Fields"})}
          </Link>
          <Link to={`/custom-fields/${customField?.id}`}>
            {customField?.name}
          </Link>
        </Breadcrumbs>
        {navigation.state == "loading" && <Loader size="sm" />}
      </Group>
    )
  }

  return (
    <Group>
      <Breadcrumbs>
        <div>
          {t("customFieldDetails.name", {defaultValue: "Custom Fields"})}
        </div>
        <div>{customField?.name}</div>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}
