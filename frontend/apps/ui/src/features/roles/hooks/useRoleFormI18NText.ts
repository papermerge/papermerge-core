import {useTranslation} from "react-i18next"
import {useEffect, useState} from "react"
import {I18NRoleFormModal} from "kommon"

export default function useI18NText(): I18NRoleFormModal | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NRoleFormModal>()
  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        submit: t("common.save"),
        cancel: t("common.cancel"),
        roleForm: {
          name: t("roleForm.name"),
          collapseButton: {
            collapseAll: t("roleForm.collapseButton.collapseAll"),
            expandAll: t("roleForm.collapseButton.expandAll")
          },
          checkButton: {
            checkAll: "Alle auswählen",
            uncheckAll: "Alle abwählen"
          },
          permissionTree: {
            folders: "Ordner",
            documents: "Dokumente",
            page_management: "Seitenverwaltung",
            categories: "Kategorien",
            shares: "Freigaben",
            users: "Benutzer",
            roles: "Rollen",
            groups: "Gruppen",
            view: "Anzeigen",
            create: "Erstellen",
            update: "Bearbeiten",
            move: "Verschieben",
            delete: "Löschen",
            download: "Herunterladen",
            upload: "Hochladen",
            extract: "Extrahieren",
            rotate: "Drehen",
            reorder: "Neu anordnen",
            select: "Auswählen",
            all_versions: "Alle Versionen",
            only_last_version: "Nur letzte Version",
            title: "Titel",
            custom_fields: "Benutzerdefinierte Felder",
            tags: "Schlagwörter",
            category: "Kategorie"
          }
        }
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
