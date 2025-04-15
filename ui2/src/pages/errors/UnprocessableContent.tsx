import {Center, Stack, Text, Title} from "@mantine/core"

export default function UnprocessableContent() {
  return (
    <>
      <Center my="xl">
        <Stack>
          <Title>422 Unprocessable Content</Title>
          <Text size="xl">
            Maybe URL has wrong format (e.g. missing some characters in UUID)?
          </Text>
        </Stack>
      </Center>
    </>
  )
}
