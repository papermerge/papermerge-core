import {Center, Stack, Text, Title} from "@mantine/core"
import {useTranslation} from "react-i18next"

export default function AccessForbidden() {
  const {t} = useTranslation()

  return (
    <>
      <Center my="xl">
        <Stack>
          <Title>403 {t("pages.error.access_forbidden.title")}</Title>
          <Text size="xl">{t("pages.error.access_forbidden.message")}</Text>
        </Stack>
      </Center>
    </>
  )
}
