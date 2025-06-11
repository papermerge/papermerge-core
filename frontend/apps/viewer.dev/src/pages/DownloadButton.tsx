import {Checkbox, Group, Stack} from "@mantine/core"
import type {I18NDownloadButtonText} from "@papermerge/viewer"
import {DownloadButton} from "@papermerge/viewer"

import {useEffect, useState} from "react"

export default function OnePage() {
  const [i18nReady, setI18nReady] = useState<boolean>(false)
  const [txt, setTxt] = useState<I18NDownloadButtonText>()

  useEffect(() => {
    if (i18nReady) {
      setTxt({
        downloadInProgressLabel: "Download in progress...",
        downloadLabel: "Download document"
      })
    } else {
      setTxt(undefined)
    }
  }, [i18nReady])

  const toggleI18nReady = () => {
    setI18nReady(!i18nReady)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Is i18n ready" onClick={toggleI18nReady} />
      </Group>
      <DownloadButton i18nIsReady={i18nReady} txt={txt} />
    </Stack>
  )
}
