import {createSlice} from "@reduxjs/toolkit"

const initialState = {
  id: null
}

const currentNodeSlice = createSlice({
  name: "currentNode",
  initialState,
  reducers: {
    setCurrentNode(state, action) {
      if (!state) {
        state = {
          id: action.payload
        }
      } else {
        state.id = action.payload
      }
    }
  }
})

export const {setCurrentNode} = currentNodeSlice.actions
export default currentNodeSlice.reducer

export const selectCurrentNodeId = (state: any) => state.currentNode.id
