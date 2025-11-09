import {Box, Stack, Text} from "@mantine/core"
import {useTranslation} from "react-i18next"
import SelectDocumentCategory from "./SelectDocumentCategory"

export default function PickupDocumentCategory() {
  const {t} = useTranslation()

  return (
    <Box
      display={"flex"}
      style={{justifyContent: "center", alignItems: "center"}}
    >
      <Stack>
        <Text>
          {t("documentsListByCategory.selectCategory", {
            defaultValue: "Please select a category to view documents"
          })}
        </Text>
        <SelectDocumentCategory />
      </Stack>
    </Box>
  )
}
