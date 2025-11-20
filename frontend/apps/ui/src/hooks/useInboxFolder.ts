import {useAppSelector} from "@/app/hooks"
import {selectCurrentUser} from "@/slices/currentUser"
import type {SpecialFolderType} from "@/types"
import {IconInbox} from "@tabler/icons-react"
import {useMemo} from "react"
import {useTranslation} from "react-i18next"

export default function useInboxFolder(): SpecialFolderType | null {
  const currentUser = useAppSelector(selectCurrentUser)
  const {t} = useTranslation()

  return useMemo(() => {
    if (!currentUser) {
      return null
    }

    return {
      id: currentUser.inbox_folder_id,
      label: t("common.Inbox", {defaultValue: "Inbox"}),
      icon: IconInbox
    }
  }, [currentUser, t])
}
