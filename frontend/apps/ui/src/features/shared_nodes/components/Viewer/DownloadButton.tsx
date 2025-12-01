import {useAppDispatch} from "@/app/hooks"
import useDownloadButton from "@/features/document/components/DownloadButton/useDownloadButton"
import {useCurrentDoc} from "@/features/document/hooks"
import {fetchAndDownloadDocument} from "@/features/document/store/documentDownloadsSlice"
import {UUID} from "@/types.d/common"
import {useState} from "react"
import {DownloadButton} from "viewer"

export default function DownloadButtonContainer() {
  const [wasOpened, setWasOpened] = useState<boolean>(false)
  const {doc} = useCurrentDoc()
  const {versions, txt, isError, isLoading, i18nIsReady} = useDownloadButton({
    initiateListDownload: wasOpened,
    nodeID: doc?.id
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
