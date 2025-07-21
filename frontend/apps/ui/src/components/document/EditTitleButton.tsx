import {ActionIcon, Box, Skeleton, Tooltip} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"
import {forwardRef} from "react"

import {useTranslation} from "react-i18next"

interface Args {
  hidden?: boolean
  isFetching: boolean
  isError: boolean
  onClick: () => void
}

const EditTitleButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {t} = useTranslation()

  const {hidden, isFetching, isError, onClick} = props

  if (isFetching) {
    return <ActionButtonSkeleton />
  }

  if (isError) {
    return (
      <ActionIcon>
        <IconEdit stroke={1.4} color={"red"} />
      </ActionIcon>
    )
  }

  return (
    <Box>
      <Tooltip label={t("common.change_title")} withArrow>
        <ActionIcon
          style={hidden ? {display: "None"} : {}}
          ref={ref}
          size={"lg"}
          variant="default"
          onClick={onClick}
        >
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Tooltip>
    </Box>
  )
})

function ActionButtonSkeleton() {
  return (
    <div>
      <Skeleton>
        <ActionIcon size={"lg"} variant="default">
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Skeleton>
    </div>
  )
}

export default EditTitleButton
