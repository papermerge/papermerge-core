import {UnstyledButton, Flex} from "@mantine/core"
import {IconMenu2} from "@tabler/icons-react"
import classes from "./ThumbnailsToggle.module.css"

export default function ThumbnailsToggle() {
  const onClick = () => {
    console.log("Thumbnails toggled")
  }

  return (
    <Flex align-items={"flex-start"} className={classes.thumbnailsToggle}>
      <UnstyledButton onClick={() => onClick()}>
        <IconMenu2 />
      </UnstyledButton>
    </Flex>
  )
}
