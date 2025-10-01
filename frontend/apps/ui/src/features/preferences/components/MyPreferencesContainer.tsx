import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useUpdateMyPreferencesMutation} from "@/features/preferences/storage/api"
import {
  selectMyPreferences,
  updateMyPreferences
} from "@/features/preferences/storage/preference"
import {Preferences} from "@/features/preferences/types"
import {ComboboxItem} from "@mantine/core"
import {notifications} from "@mantine/notifications"
import {useTranslation} from "react-i18next"
import PreferencesForm from "./PreferencesForm"

export default function MyPreferencesContainer() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const myPreferences = useAppSelector(selectMyPreferences)
  const [updatePreferences, {isLoading}] = useUpdateMyPreferencesMutation()

  const onChange = async (
    preferenceName: keyof Preferences,
    option: ComboboxItem
  ) => {
    const update = {
      [preferenceName]: option.value
    }
    console.log(update)

    const previousValue = myPreferences[preferenceName]

    dispatch(updateMyPreferences(update))

    try {
      await updatePreferences(update).unwrap()

      notifications.show({
        title: t("preferences.updateSuccessTitle"),
        message: t("preferences.updateSuccessMessage"),
        color: "green"
      })
    } catch (error) {
      // Rollback on error
      dispatch(
        updateMyPreferences({
          [preferenceName]: previousValue
        })
      )

      console.error("Failed to update preferences:", error)

      notifications.show({
        title: t("preferences.updateErrorTitle"),
        message: t("preferences.updateErrorMessage"),
        color: "red"
      })
    }
  }

  return (
    <PreferencesForm
      preferences={myPreferences}
      onChange={onChange}
      isLoading={isLoading}
      t={t}
    />
  )
}
