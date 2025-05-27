import {useRuntimeConfig} from "@/hooks/runtime_config"
import {OCRCode} from "@/types/ocr"
import {langCodes2ComboboxData} from "@/utils"
import {Select, Stack} from "@mantine/core"
import {useState} from "react"

interface Args {
  defaultLang: OCRCode
  onLangChange: (newLang: OCRCode) => void
}

export default function ScheduleOCRProcessCheckbox({
  defaultLang,
  onLangChange
}: Args) {
  const runtimeConfig = useRuntimeConfig()
  const langData = langCodes2ComboboxData(runtimeConfig.ocr__lang_codes)
  const [lang, setLang] = useState<OCRCode>(defaultLang)

  const onLangChangeLocal = (value: string | null) => {
    if (value) {
      setLang(value as OCRCode)
      onLangChange(value as OCRCode)
    }
  }

  return (
    <Stack my={"md"}>
      <Select
        searchable
        defaultValue={defaultLang}
        onChange={onLangChangeLocal}
        data={langData}
        value={lang}
      />
    </Stack>
  )
}
