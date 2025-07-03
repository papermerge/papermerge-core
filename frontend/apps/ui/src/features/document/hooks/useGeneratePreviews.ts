import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import type {DocumentVersion} from "@/features/document/types"
import {getDocLastVersion} from "@/features/document/utils"
import {fileManager} from "@/features/files/fileManager"
import {ImageSize} from "@/types.d/common"
import {useEffect} from "react"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  pageSize: number
  imageSize: ImageSize
}

export default function useGeneratePreviews({
  docVer,
  pageSize,
  pageNumber,
  imageSize
}: Args): boolean {
  const dispatch = useAppDispatch()
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize,
    pageNumber,
    imageSize
  })

  useEffect(() => {
    const generate = async () => {
      if (!allPreviewsAreAvailable) {
        if (!fileManager.getByDocVerID(docVer.id)) {
          /*
          console.log(
            `BEFORE WAIT allPreviewsAreAvailable=${allPreviewsAreAvailable} pageNumber=${pageNumber}`
          )
          */
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
          /*
          console.log(
            `AFTER WAIT allPreviewsAreAvailable=${allPreviewsAreAvailable} pageNumber=${pageNumber}`
          )
          */
        }
        /*
        console.log(
          `Dispatching generate previews for size="md" pageNumber=${pageNumber}`
        )
        */
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
