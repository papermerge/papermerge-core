import {useTranslation} from "react-i18next"
import {Preference} from "../types"
import PreferencesForm from "./PreferencesForm"

export default function MyPreferencesContainer() {
  const {t} = useTranslation()

  const prefs: Preference = {
    ui_language: "en",
    date_format: "DD.MM.YYYY",
    timestamp_format: "DD.MM.YYYY HH:mm:ss"
  }

  return <PreferencesForm preferences={prefs} t={t} />
}
