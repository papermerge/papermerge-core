import {useAppSelector} from "@/app/hooks"
import {useTranslation} from "react-i18next"
import {selectMePreferences} from "../storage/preference"
import PreferencesForm from "./PreferencesForm"

export default function MyPreferencesContainer() {
  const {t} = useTranslation()
  const myPreferences = useAppSelector(selectMePreferences)

  return <PreferencesForm preferences={myPreferences} t={t} />
}
