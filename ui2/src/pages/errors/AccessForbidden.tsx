import {Center, Stack, Text, Title} from "@mantine/core"

export default function AccessForbidden() {
  return (
    <>
      <Center my="xl">
        <Stack>
          <Title>403 Access Forbidden</Title>
          <Text size="xl">
            You don't have enough permissions to access the resource
          </Text>
        </Stack>
      </Center>
    </>
  )
}
