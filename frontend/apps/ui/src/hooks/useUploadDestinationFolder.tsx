import {useAppSelector} from "@/app/hooks"
import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {SpecialFolderType} from "@/types"
import {IconFolder} from "@tabler/icons-react"
import {useMemo} from "react"
import {useTranslation} from "react-i18next"
import useHomeFolder from "./useHomeFolder"
import useInboxFolder from "./useInboxFolder"

export default function useUploadDestinationFolder(): SpecialFolderType[] {
  const {t} = useTranslation()
  const homeFolder = useHomeFolder()
  const inboxFolder = useInboxFolder()
  const folderID = useAppSelector(s => selectCurrentNodeID(s, "main"))

  return useMemo(() => {
    const ret: SpecialFolderType[] = []

    if (inboxFolder) {
      ret.push(inboxFolder)
    }

    if (homeFolder) {
      ret.push(homeFolder)
    }

    if (folderID) {
      ret.push({
        id: folderID,
        label: t("common.current_location", {defaultValue: "Current Location"}),
        icon: IconFolder
      })
    }

    return ret
  }, [homeFolder, inboxFolder, folderID])
}
