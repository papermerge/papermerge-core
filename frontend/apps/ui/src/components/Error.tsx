import {Text, rem} from "@mantine/core"

export default function Error({message}: {message: string}) {
  return (
    <Text mt={rem(4)} c="red">
      {message}
    </Text>
  )
}
