import {useGetDocVersionsListQuery} from "@/features/document/apiSlice"
import type {DocVersItem} from "@/features/document/types"
import {UUID} from "@/types.d/common"
import type {
  DownloadDocumentVersion,
  I18NDownloadButtonText
} from "@papermerge/viewer"
import {skipToken} from "@reduxjs/toolkit/query"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  initiateListDownload?: boolean
  nodeID?: UUID
}

interface DownloadButtonState {
  versions?: Array<DownloadDocumentVersion>
  txt?: I18NDownloadButtonText
  i18nIsReady: boolean
  isLoading: boolean
  isError: boolean
}

export default function useDownloadButton({
  initiateListDownload = false,
  nodeID
}: Args): DownloadButtonState {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NDownloadButtonText>()
  const [versions, setVersions] = useState<Array<DownloadDocumentVersion>>()

  const apiParam = initiateListDownload && nodeID ? nodeID : skipToken
  const {data, isError, isLoading} = useGetDocVersionsListQuery(apiParam)

  useEffect(() => {
    if (i18n.isInitialized) {
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
  }, [i18n.isInitialized])

  useEffect(() => {
    if (data) {
      const vers = data?.map((d: DocVersItem) => {
        return {
          id: d.id,
          number: d.number,
          shortDescription: d.short_description
        }
      })
      setVersions(vers)
    }
  }, [data])

  return {
    i18nIsReady: i18n.isInitialized,
    versions,
    txt,
    isLoading,
    isError
  }
}
