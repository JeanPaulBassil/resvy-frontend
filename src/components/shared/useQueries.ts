import { useState, useCallback, useRef } from 'react'

type UseQueriesReturnType<T> = {
  get: () => T
  set: (newValues: Partial<T>) => void
}

const useOrderedQueries = <T extends object>(initialState: T): UseQueriesReturnType<T> => {
  const initialRef = useRef(initialState) // Store initialState in a ref
  const [queries, setQueries] = useState<T>(initialState)

  const get = useCallback((): T => {
    return { ...queries }
  }, [queries])

  const set = useCallback((newValues: Partial<T>): void => {
    setQueries((prev) => {
      const updatedQueries = { ...prev, ...newValues }
      const orderedQueries: T = Object.keys(initialRef.current).reduce((acc, key) => {
        acc[key as keyof T] = updatedQueries[key as keyof T]
        return acc
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      }, {} as T)
      Object.keys(updatedQueries).forEach((key) => {
        if (!(key in initialRef.current)) {
          orderedQueries[key as keyof T] = updatedQueries[key as keyof T]
        }
      })
      return orderedQueries
    })
  }, [])

  return { get, set }
}

export default useOrderedQueries
