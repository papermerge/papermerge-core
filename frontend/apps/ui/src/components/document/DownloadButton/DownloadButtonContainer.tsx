import {DownloadButton} from "@papermerge/viewer"
import {useState} from "react"
import useDownloadButton from "./useDownloadButton"

export default function DownloadButtonContainer() {
  const [wasOpened, setWasOpened] = useState<boolean>(false)
  const {versions, txt, isError, isLoading, i18nIsReady} = useDownloadButton({
    initiateListDownload: wasOpened
  })
  const onOpen = () => {
    setWasOpened(true)
  }

  return (
    <DownloadButton
      i18nIsReady={i18nIsReady}
      isLoading={isLoading}
      onOpen={onOpen}
      versions={versions}
      isError={isError}
      txt={txt}
    />
  )
}
