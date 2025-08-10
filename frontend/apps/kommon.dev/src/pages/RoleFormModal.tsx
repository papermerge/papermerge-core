import {
  Button,
  Group,
  Stack,
  Checkbox,
  CheckedNodeStatus,
  Select,
  ComboboxItem
} from "@mantine/core"
import {RoleFormModal} from "kommon"
import type {I18NRoleFormModal} from "kommon"
import {useState, useEffect} from "react"

type Lang = "german" | "english"

export default function RoleFormModalContainer() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)
  const [lang, setLang] = useState<Lang>("english")
  const initialCheckedState: string[] = []
  const [txt, setTxt] = useState<I18NRoleFormModal>()

  const onPermissionsChange = (checkedPermissions: CheckedNodeStatus[]) => {
    console.log(checkedPermissions)
  }

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value) {
      setLang(option.value as Lang)
    }
  }

  useEffect(() => {
    if (lang == "german") {
      setTxt({
        submit: "Speichern",
        cancel: "Abrechen",
        roleForm: {
          name: "Name",
          collapseButton: {
            collapseAll: "Alles einklappen",
            expandAll: " Alles ausklappen"
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
  }, [lang])

  return (
    <Stack>
      <Group>
        <Button onClick={() => setOpened(true)}>Open</Button>
        <Checkbox label="Loading" onClick={() => setIsLoading(!isLoading)} />
        <Select
          label="Language"
          placeholder="Pick a value"
          data={["english", "german"]}
          onChange={onSelect}
        />
      </Group>

      <Group>
        <RoleFormModal
          opened={opened}
          title={"New Role"}
          txt={txt}
          initialCheckedState={initialCheckedState}
          inProgress={isLoading}
          onCancel={() => setOpened(false)}
          onSubmit={() => setOpened(false)}
        />
      </Group>
    </Stack>
  )
}
