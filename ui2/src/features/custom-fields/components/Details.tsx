import {Box, Breadcrumbs, Group, Loader, LoadingOverlay} from "@mantine/core"
import {Link, useNavigation} from "react-router-dom"

import {useGetCustomFieldQuery} from "@/features/custom-fields/apiSlice"
import type {CustomField} from "@/types"
import CustomFieldForm from "./CustomFieldForm"
import {DeleteCustomFieldButton} from "./DeleteButton"
import EditButton from "./EditButton"

interface CustomFieldDetailsArgs {
  customFieldId: string
}

export default function CustomFieldDetailsComponent({
  customFieldId
}: CustomFieldDetailsArgs) {
  const {data, isLoading} = useGetCustomFieldQuery(customFieldId)

  if (isLoading || !data) {
    return (
      <Box pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Path customField={null} />
        <CustomFieldForm customField={null} />
      </Box>
    )
  }

  return (
    <>
      <Group justify="space-between">
        <Path customField={data} />
        <ActionButtons modelId={data?.id} />
      </Group>
      <CustomFieldForm customField={data} />
    </>
  )
}

function Path({customField}: {customField: CustomField | null}) {
  const navigation = useNavigation()

  return (
    <Group>
      <Breadcrumbs>
        <Link to="/custom-fields/">Custom Fields</Link>
        <Link to={`/custom-fields/${customField?.id}`}>
          {customField?.name}
        </Link>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size="sm" />}
    </Group>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <EditButton customFieldId={modelId!} />
      <DeleteCustomFieldButton customFieldId={modelId!} />
    </Group>
  )
}
