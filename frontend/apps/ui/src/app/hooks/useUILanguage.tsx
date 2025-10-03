import {useEffect} from "react"
import {useTranslation} from "react-i18next"

import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {useAppSelector} from "./useApp"

export default function useUILanguage() {
  const {i18n} = useTranslation()
  const {ui_language} = useAppSelector(selectMyPreferences)

  useEffect(() => {
    if (ui_language && i18n.language !== ui_language) {
      i18n.changeLanguage(ui_language).catch(error => {
        console.error("Failed to change language:", error)
      })
    }
  }, [ui_language, i18n])
}
