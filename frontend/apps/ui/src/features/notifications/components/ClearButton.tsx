import {useAppSelector} from "@/app/hooks"
import {selectNotificationCount} from "@/features/notifications/storage/notifications"
import {notifications} from "@/features/notifications/utils"
import {ActionIcon, Badge, Box, Tooltip} from "@mantine/core"
import {IconBellOff} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

interface ClearNotificationsButtonProps {
  threshold?: number
}

export function ClearNotificationsButton({
  threshold = 1
}: ClearNotificationsButtonProps) {
  const {t} = useTranslation()
  const count = useAppSelector(selectNotificationCount)

  if (count <= threshold) {
    return null
  }

  return (
    <Tooltip
      label={t("clearNotifications", {
        count,
        defaultValue: "Clear {{count}} notifications"
      })}
    >
      <ActionIcon
        variant="transparent"
        size="lg"
        onClick={() => notifications.clean()}
        aria-label="Clear all notifications"
      >
        <Box pos="relative">
          <IconBellOff size={18} />
          <Badge size="xs" circle pos="absolute" top={-8} right={-8}>
            {count}
          </Badge>
        </Box>
      </ActionIcon>
    </Tooltip>
  )
}
