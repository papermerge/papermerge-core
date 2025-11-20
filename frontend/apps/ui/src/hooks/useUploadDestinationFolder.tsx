import {SpecialFolderType} from "@/types"
import {useMemo} from "react"
import useHomeFolder from "./useHomeFolder"
import useInboxFolder from "./useInboxFolder"

export default function useUploadDestinationFolder(): SpecialFolderType[] {
  const homeFolder = useHomeFolder()
  const inboxFolder = useInboxFolder()

  return useMemo(() => {
    const ret: SpecialFolderType[] = []

    if (homeFolder) {
      ret.push(homeFolder)
    }

    if (inboxFolder) {
      ret.push(inboxFolder)
    }

    return ret
  }, [homeFolder, inboxFolder])
}
