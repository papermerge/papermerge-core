import {useAppDispatch} from "@/app/hooks"
import {fetchAndDownloadDocument} from "@/features/document/documentDownloadsSlice"
import useCurrentNodeID from "@/hooks/useCurrentNodeID"
import {UUID} from "@/types.d/common"
import {DownloadButton} from "@papermerge/viewer"
import {useState} from "react"
import useDownloadButton from "./useDownloadButton"

export default function DownloadButtonContainer() {
  const [wasOpened, setWasOpened] = useState<boolean>(false)
  const currentNodeID = useCurrentNodeID()
  const {versions, txt, isError, isLoading, i18nIsReady} = useDownloadButton({
    initiateListDownload: wasOpened,
    nodeID: currentNodeID
  })
  const dispatch = useAppDispatch()
  /*
  const loading = useAppSelector(
    state => state.documentDownloads.loadingById[docVerId] || false
  )
  const error = useAppSelector(
    state => state.documentDownloads.errorById[docVerId]
  )
    */

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
