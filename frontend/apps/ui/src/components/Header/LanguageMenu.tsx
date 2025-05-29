import { SUPPORTED_LANGS } from "@/cconstants"
import { Group, Menu, UnstyledButton } from "@mantine/core"
import { IconLanguage } from "@tabler/icons-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

const LanguageMenu: React.FC = () => {
  const {i18n} = useTranslation()

  const onLangSelected = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
  }

  return (
    <Menu withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group>
            <IconLanguage />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {SUPPORTED_LANGS.map(language => (
          <Menu.Item key={language.code}>
            <a onClick={() => onLangSelected(language.code)}>{language.name}</a>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

export default LanguageMenu
