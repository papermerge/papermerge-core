import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import {getDocLastVersion} from "@/features/document/utils"
import {fileManager} from "@/features/files/fileManager"
import {ClientDocumentVersion} from "@/types"
import {ImageSize} from "@/types.d/common"
import {useEffect} from "react"

interface Args {
  docVer?: ClientDocumentVersion
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
      if (!docVer) {
        return
      }

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
            size: imageSize,
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
