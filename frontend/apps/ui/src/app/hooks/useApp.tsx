import {useDispatch, useSelector} from "react-redux"
import type {AppDispatch, RootState} from "../types"

// Use throughout your app instead of plain `useDispatch` and `useSelector`
const useAppDispatch = useDispatch.withTypes<AppDispatch>()
const useAppSelector = useSelector.withTypes<RootState>()

export {useAppDispatch, useAppSelector}
