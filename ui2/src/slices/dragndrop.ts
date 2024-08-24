import {PageAndRotOp} from "@/types"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {RootState} from "@/app/types"

type DragNDrop = {
  pages: Array<PageAndRotOp> | null
}

const initialState: DragNDrop = {
  pages: null
}

const dragndropSlice = createSlice({
  name: "dragndrop",
  initialState,
  reducers: {
    dragPagesStart(state, action: PayloadAction<Array<PageAndRotOp>>) {
      state.pages = action.payload
    },
    dragPagesEnd(state) {
      state.pages = []
    }
  }
})

export default dragndropSlice.reducer

export const {dragPagesStart, dragPagesEnd} = dragndropSlice.actions

export const selectDraggedPages = (state: RootState) => state.dragndrop.pages
