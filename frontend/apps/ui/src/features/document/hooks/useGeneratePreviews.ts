import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import type {DocumentVersion} from "@/features/document/types"
import {getDocLastVersion} from "@/features/document/utils"
import {fileManager} from "@/features/files/fileManager"
import {useEffect} from "react"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  pageSize: number
}

export default function useGeneratePreviews({
  docVer,
  pageSize,
  pageNumber
}: Args): boolean {
  const dispatch = useAppDispatch()
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize,
    pageNumber
  })

  useEffect(() => {
    const generate = async () => {
      console.log(
        `allPreviewsAreAvailable=${allPreviewsAreAvailable} pageNumber=${pageNumber}`
      )
      if (!allPreviewsAreAvailable) {
        if (!fileManager.getByDocVerID(docVer.id)) {
          const {
            ok,
            data,
            error: downloadError
          } = await getDocLastVersion(docVer.document_id)
          if (ok && data) {
            const arrayBuffer = await data.blob.arrayBuffer()
            fileManager.store({
              buffer: arrayBuffer,
              docVerID: data.docVerID
            })
          } else {
            console.error(downloadError || "Unknown download error")
            return
          }
        }
        dispatch(
          generatePreviews({
            docVer,
            size: "md",
            pageSize,
            pageNumber,
            pageTotal: docVer.pages.length
          })
        )
      }
    }

    generate()
  }, [dispatch, docVer, pageSize, pageNumber, allPreviewsAreAvailable])

  return allPreviewsAreAvailable
}
