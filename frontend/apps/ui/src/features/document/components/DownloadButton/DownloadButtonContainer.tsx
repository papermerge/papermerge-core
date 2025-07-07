import {useAppDispatch} from "@/app/hooks"
import {fetchAndDownloadDocument} from "@/features/document/store/documentDownloadsSlice"
import {useCurrentNode} from "@/hooks"
import {UUID} from "@/types.d/common"
import {useState} from "react"
import {DownloadButton} from "viewer"
import useDownloadButton from "./useDownloadButton"

export default function DownloadButtonContainer() {
  const [wasOpened, setWasOpened] = useState<boolean>(false)
  const {currentNodeID} = useCurrentNode()
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
