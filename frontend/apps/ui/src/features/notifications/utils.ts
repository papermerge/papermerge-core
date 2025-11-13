import {store} from "@/app/store"
import {
  notificationHidden,
  notificationsCleared,
  notificationShown
} from "@/features/notifications/storage/notifications"
import {notifications as mantineNotifications} from "@mantine/notifications"

export const notifications = {
  show: (props: any) => {
    const id = mantineNotifications.show({
      ...props,
      onClose: () => {
        store.dispatch(notificationHidden())
        props.onClose?.()
      },
      autoClose: props.autoClose ?? 5000
    })
    store.dispatch(notificationShown())
    return id
  },

  clean: () => {
    mantineNotifications.clean()
    store.dispatch(notificationsCleared())
  },

  // Other notification methods
  update: mantineNotifications.update,
  hide: (id: string) => {
    mantineNotifications.hide(id)
    store.dispatch(notificationHidden())
  }
}
