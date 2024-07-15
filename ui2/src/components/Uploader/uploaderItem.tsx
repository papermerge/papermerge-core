import {useContext} from "react"
import {List, Box, Group, ThemeIcon, rem} from "@mantine/core"
import {IconCircleCheck, IconFolder} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"
import {useSelector} from "react-redux"
import PanelContext from "@/contexts/PanelContext"
import {FileItemType, PanelMode} from "@/types"
import type {RootState} from "@/app/types"
import classes from "./uploaderItem.module.css"
import {selectLastPageSize} from "@/slices/dualPanel/dualPanel"

type Args = {
  fileItem: FileItemType
}

export default function UploaderItem({fileItem}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, mode)
  )
  const onTargetClick = () => {
    navigate(`/folder/${fileItem.target.id}?page_size=${lastPageSize}`)
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
