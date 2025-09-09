import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetRoleQuery} from "@/features/roles/storage/api"
import {selectRoleDetailsID} from "@/features/roles/storage/role"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanelMode} from "@/hooks"
import {Group, Stack} from "@mantine/core"

export default function RoleDetailsContainer() {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const roleID = useAppSelector(s => selectRoleDetailsID(s, mode))
  const {data, isLoading, error} = useGetRoleQuery(roleID || "", {
    skip: !roleID
  })

  return (
    <Stack>
      <Group justify="space-between">
        <CloseSecondaryPanel
          onClick={() => dispatch(closeRoleDetailsSecondaryPanel())}
        />
      </Group>
      {data?.id}
    </Stack>
  )
}
