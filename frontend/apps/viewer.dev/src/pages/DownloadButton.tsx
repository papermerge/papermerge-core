import {Checkbox, ComboboxItem, Group, Select, Stack} from "@mantine/core"
import type {
  DownloadDocumentVersion,
  I18NDownloadButtonText
} from "@papermerge/viewer"
import {DownloadButton} from "@papermerge/viewer"

import {useEffect, useState} from "react"

const NULL_OR_UNDEFINED = "null or undefined"
const EMPTY = "empty list"
const ONE_ITEM = "one item"
const TWO_ITEMS = "two items"

export default function OnePage() {
  const [i18nReady, setI18nReady] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [txt, setTxt] = useState<I18NDownloadButtonText>()
  const [versions, setVersions] = useState<DownloadDocumentVersion[] | null>(
    null
  )

  useEffect(() => {
    if (i18nReady) {
      setTxt({
        downloadInProgressTooltip: "Download in progress...",
        downloadTooltip: "Download document",
        loadingTooltip: "Loading...",
        error: "Error: Oops, it didn't work",
        emptyVersionsArrayError: "Error: empty version list",
        versionLabel: "Version"
      })
    } else {
      setTxt(undefined)
    }
  }, [i18nReady])

  const toggleI18nReady = () => {
    setI18nReady(!i18nReady)
  }

  const toggleIsLoading = () => {
    setIsLoading(!isLoading)
  }

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value == NULL_OR_UNDEFINED) {
      setVersions(null)
    } else if (option?.value == EMPTY) {
      setVersions([])
    } else if (option?.value == ONE_ITEM) {
      setVersions([{id: "123", number: 1, shortDescription: "Orignal"}])
    } else if (option?.value == TWO_ITEMS) {
      setVersions([
        {id: "123", number: 1, shortDescription: "Orignal"},
        {id: "345", number: 2, shortDescription: "OCRed"}
      ])
    }
  }

  const onClick = (docVerID: string) => {
    alert(`Clicked on docVerID=${docVerID}`)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Is i18n ready" onClick={toggleI18nReady} />
        <Checkbox label="Is Loading" onClick={toggleIsLoading} />
        <Select
          label="Versions"
          placeholder="Pick a value"
          data={[NULL_OR_UNDEFINED, EMPTY, ONE_ITEM, TWO_ITEMS]}
          onChange={onSelect}
        />
      </Group>
      <DownloadButton
        i18nIsReady={i18nReady}
        txt={txt}
        isLoading={isLoading}
        versions={versions}
        onClick={onClick}
      />
    </Stack>
  )
}
