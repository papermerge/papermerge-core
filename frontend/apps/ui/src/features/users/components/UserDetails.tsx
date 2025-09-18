import {Box, Breadcrumbs, Group, Loader, LoadingOverlay} from "@mantine/core"
import {Link, useNavigation} from "react-router-dom"

import {useGetUserQuery} from "@/features/users/storage/api"
import type {UserDetails} from "@/types"
import ChangePasswordButton from "./ChangePasswordButton"
import {DeleteUserButton} from "./DeleteButton"
import EditButton from "./EditButton"
import UserForm from "./UserForm"

interface UserDetailsArgs {
  userId: string
}

export default function UserDetailsComponent({userId}: UserDetailsArgs) {
  const {data} = useGetUserQuery(userId)

  if (data == null) {
    return (
      <Box pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Path user={null} />
        <UserForm user={null} />
      </Box>
    )
  }

  return (
    <>
      <Group justify="space-between">
        <Path user={data} />
        <ActionButtons modelId={data?.id} />
      </Group>
      <UserForm user={data} />
    </>
  )
}

function Path({user}: {user: UserDetails | null}) {
  const navigation = useNavigation()

  return (
    <Group>
      <Breadcrumbs>
        <Link to="/users/">Users</Link>
        <Link to={`/users/${user?.id}`}>{user?.username}</Link>
      </Breadcrumbs>
      {navigation.state == "loading" && <Loader size={"sm"} />}
    </Group>
  )
}

function ActionButtons({modelId}: {modelId?: string}) {
  return (
    <Group>
      <ChangePasswordButton userId={modelId} />
      <EditButton userId={modelId} />
      <DeleteUserButton userId={modelId!} />
    </Group>
  )
}
