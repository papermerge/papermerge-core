import {Center, Stack, Text, Title} from "@mantine/core"
import {useTranslation} from "react-i18next"

export default function NotFound() {
  const {t} = useTranslation()

  return (
    <>
      <Center my="xl">
        <Stack>
          <Title>404 {t("pages.error.not_found.title")}</Title>
          <Text size="xl">{t("pages.error.access_forbidden.message")}d</Text>
        </Stack>
      </Center>
    </>
  )
}
