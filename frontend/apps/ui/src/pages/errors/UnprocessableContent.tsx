import {Center, Stack, Text, Title} from "@mantine/core"
import {useTranslation} from "react-i18next"

export default function UnprocessableContent() {
  const {t} = useTranslation()

  return (
    <>
      <Center my="xl">
        <Stack>
          <Title>422 {t("pages.error.unprocessable_content.title")}</Title>
          <Text size="xl">
            {t("pages.error.unprocessable_content.message")}
          </Text>
        </Stack>
      </Center>
    </>
  )
}
