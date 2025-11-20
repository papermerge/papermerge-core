import {useAppSelector} from "@/app/hooks"
import {selectCurrentUser} from "@/slices/currentUser"
import type {SpecialFolderType} from "@/types"
import {IconHome} from "@tabler/icons-react"
import {useMemo} from "react"
import {useTranslation} from "react-i18next"

export default function useHomeFolder(): SpecialFolderType | null {
  const currentUser = useAppSelector(selectCurrentUser)
  const {t} = useTranslation()

  return useMemo(() => {
    if (!currentUser) {
      return null
    }

    return {
      id: currentUser.home_folder_id,
      label: t("common.home", {defaultValue: "Home"}),
      icon: IconHome
    }
  }, [currentUser, t])
}
