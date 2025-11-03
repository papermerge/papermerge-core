import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {Token} from "@/features/search/microcomp/types"
import {
  addToken as addTokenAction,
  clearTokens as clearTokensAction,
  removeToken as removeTokenAction,
  setTokens as setTokensAction,
  updateToken as updateTokenAction
} from "@/features/search/storage/search"
import {useCallback} from "react"

export function useTokens() {
  const dispatch = useAppDispatch()
  const tokens = useAppSelector(state => state.search.tokens)

  const addToken = useCallback(
    (token: Token) => {
      dispatch(addTokenAction(token))
    },
    [dispatch]
  )

  const updateToken = useCallback(
    (index: number, updates: Partial<Token>) => {
      dispatch(updateTokenAction({index, updates}))
    },
    [dispatch]
  )

  const removeToken = useCallback(
    (index: number) => {
      dispatch(removeTokenAction(index))
    },
    [dispatch]
  )

  const clearTokens = useCallback(() => {
    dispatch(clearTokensAction())
  }, [dispatch])

  const setTokens = useCallback(
    (tokens: Token[]) => {
      dispatch(setTokensAction(tokens))
    },
    [dispatch]
  )

  return {
    tokens,
    addToken,
    updateToken,
    removeToken,
    clearTokens,
    setTokens
  }
}
