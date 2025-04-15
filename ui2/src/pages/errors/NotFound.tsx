import {Center, Stack, Text, Title} from "@mantine/core"

export default function NotFound() {
  return (
    <>
      <Center my="xl">
        <Stack>
          <Title>404 NotFound</Title>
          <Text size="xl">Resource not found</Text>
        </Stack>
      </Center>
    </>
  )
}
