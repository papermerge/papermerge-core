import {useAppSelector} from "@/app/hooks"
import {selectCurrentDoc} from "@/features/document/selectors"
import {DocumentType} from "@/features/document/types"

import {usePanelMode} from "@/hooks"

export default function useCurrentDoc(): DocumentType | undefined {
  const mode = usePanelMode()
  return useAppSelector(s => selectCurrentDoc(s, mode))
}
