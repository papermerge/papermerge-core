import CopyButton from "@/components/CopyButton"
import {Box, Checkbox, Pill, TextInput} from "@mantine/core"

import {OWNER_ME} from "@/cconstants"
import {ColoredTagType} from "@/types"
import {useTranslation} from "react-i18next"

type Args = {
  tag: ColoredTagType | null
}

export default function TagForm({tag}: Args) {
  const {t} = useTranslation()
  return (
    <Box>
      <TextInput
        my="md"
        label="ID"
        value={tag?.id || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={tag?.id || ""} />}
      />
      <Box my="md">
        <Pill style={{backgroundColor: tag?.bg_color, color: tag?.fg_color}}>
          {tag?.name}
        </Pill>
      </Box>
      <Checkbox
        my="md"
        checked={tag?.pinned}
        label={t("tags.form.pinned")}
        onChange={() => {}}
      />
      <TextInput
        my="md"
        label={t("tags.form.description")}
        value={tag?.description || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={tag?.description || ""} />}
      />
      <TextInput
        my="md"
        label="Owner"
        value={tag?.group_name || "Me"}
        onChange={() => {}}
        rightSection={<CopyButton value={tag?.group_name || OWNER_ME} />}
      />
    </Box>
  )
}
