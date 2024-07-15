import {List, Box, Group, ThemeIcon, rem} from "@mantine/core"
import {IconCircleCheck, IconFolder} from "@tabler/icons-react"
import {FileItemType} from "@/types"
import classes from "./uploaderItem.module.css"

type Args = {
  fileItem: FileItemType
}

export default function UploaderItem({fileItem}: Args) {
  const onTargetClick = () => {
    console.log(`Target clicked ${fileItem.target}`)
  }

  const onFileClick = () => {
    console.log(`File clicked ${fileItem.file_name}`)
  }

  return (
    <List.Item
      className={classes.uploaderItem}
      icon={
        <ThemeIcon color="green" size={24} radius="xl">
          <IconCircleCheck style={{width: rem(16), height: rem(16)}} />
        </ThemeIcon>
      }
    >
      <Group justify="space-between">
        <Group
          justify="center"
          gap="xs"
          className={classes.uploaderItemTarget}
          onClick={onTargetClick}
        >
          <IconFolder /> {fileItem.target.title}
        </Group>
        <Box className={classes.uploaderItemFile} onClick={onFileClick}>
          {fileItem.file_name}
        </Box>
      </Group>
    </List.Item>
  )
}
