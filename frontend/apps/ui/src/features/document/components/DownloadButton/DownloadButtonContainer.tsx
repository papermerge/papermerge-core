import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {fetchAndDownloadDocument} from "@/features/document/store/documentDownloadsSlice"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {UUID} from "@/types.d/common"
import {useState} from "react"
import {DownloadButton} from "viewer"
import useDownloadButton from "./useDownloadButton"

export default function DownloadButtonContainer() {
  const {panelId} = usePanel()
  const [wasOpened, setWasOpened] = useState<boolean>(false)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const {versions, txt, isError, isLoading, i18nIsReady} = useDownloadButton({
    initiateListDownload: wasOpened,
    nodeID: currentNodeID
  })
  const dispatch = useAppDispatch()

  const onOpen = () => {
    setWasOpened(true)
  }

  const onDownloadVersionClick = (docVerID: UUID) => {
    dispatch(fetchAndDownloadDocument(docVerID))
  }

  return (
    <DownloadButton
      i18nIsReady={i18nIsReady}
      isLoading={isLoading}
      onOpen={onOpen}
      onClick={onDownloadVersionClick}
      versions={versions}
      isError={isError}
      txt={txt}
    />
  )
}
