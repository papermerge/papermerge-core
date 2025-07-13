import {SUPPORTED_EXTENSIONS} from "@/features/nodes/constants"
import {I18NSupportedFilesInfoModal, SupportedFilesInfoModal} from "commander"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onClose: () => void
}

export default function SupportedFilesInfoModalContainer({
  opened,
  onClose
}: Args) {
  const txt = useI18nText()

  return (
    <SupportedFilesInfoModal
      opened={opened}
      onClose={onClose}
      supportedExtentions={SUPPORTED_EXTENSIONS}
      txt={txt}
    />
  )
}

function useI18nText(): I18NSupportedFilesInfoModal | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NSupportedFilesInfoModal>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        title: t("supportedFilesInfo.title"),
        supportedFiles: t("supportedFilesInfo.supportedFiles"),
        close: t("common.close"),
        allowedExtentions: t("supportedFilesInfo.allowedExtentions"),
        caseSensitivity: t("supportedFilesInfo.caseSensitivity")
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
