import { ServerError } from '../api/utils'
import { useToast } from '../contexts/ToastContext'
import { useMutation, QueryKey, useQueryClient } from '@tanstack/react-query'

type OptimisticUpdateParams<TItem, TVariables> =
  | {
      type: 'add'
      data: TItem | ((variables: TVariables) => TItem)
    }
  | {
      type: 'update'
      data: Partial<TItem> | ((variables: TVariables) => Partial<TItem>)
      matchItem: (item: TItem, variables: TVariables) => boolean
    }
  | {
      type: 'delete'
      matchItem: (item: TItem, variables: TVariables) => boolean
    }
  | {
      type: 'replace'
      data: TItem[] | ((variables: TVariables) => TItem[])
    }

interface AppMutationOptions<TData, TVariables, TItem> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey?: QueryKey
  successMessage?: string | ((data: TData) => string)
  errorMessage?: string | ((error: ServerError) => string)
  onSuccessCallback?: (data: TData) => void
  onErrorCallback?: (error: ServerError) => void
  optimisticUpdate?: OptimisticUpdateParams<TItem, TVariables>
  additionalInvalidateQueries?: QueryKey[]
  rollbackOnError?: boolean
  showSuccessToast?: boolean
}

function isFunction<TVariables, T>(
  data: T | ((variables: TVariables) => T)
): data is (variables: TVariables) => T {
  return typeof data === 'function'
}

function useAppMutation<TData, TVariables = void, TItem = unknown>({
  mutationFn,
  queryKey,
  successMessage,
  errorMessage = 'An error occurred. Please try again.',
  onSuccessCallback,
  onErrorCallback,
  optimisticUpdate,
  additionalInvalidateQueries = [],
  rollbackOnError = true,
  showSuccessToast = true,
}: AppMutationOptions<TData, TVariables, TItem>) {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation<TData, ServerError, TVariables, { previousData: TItem[] | undefined }>({
    mutationFn,
    onMutate: async (variables) => {
      const context: { previousData: TItem[] | undefined } = { previousData: undefined }

      if (optimisticUpdate && queryKey) {
        const { type } = optimisticUpdate
        await queryClient.cancelQueries({ queryKey })

        const previousData = queryClient.getQueryData<TItem[]>(queryKey)
        context.previousData = previousData
        let newData: TItem[]

        switch (type) {
          case 'add':
            {
              const { data } = optimisticUpdate
              const itemToAdd = isFunction(data) ? data(variables) : data
              newData = [...(previousData || []), itemToAdd]
            }
            break
          case 'update':
            {
              const { data, matchItem } = optimisticUpdate
              const updater = isFunction(data) ? data(variables) : data
              newData = (previousData || []).map((item) => {
                const matches = matchItem(item, variables)
                return matches ? { ...item, ...updater } : item
              })
            }
            break
          case 'delete':
            {
              const { matchItem } = optimisticUpdate
              newData = (previousData || []).filter((item) => !matchItem(item, variables))
            }
            break
          case 'replace':
            {
              const { data } = optimisticUpdate
              newData = isFunction(data) ? data(variables) : data
            }
            break
          default:
            newData = previousData || []
            break
        }

        queryClient.setQueryData(queryKey, newData)

        context.previousData = previousData
      }

      return context
    },
    onError: (error, _variables, context) => {
      let message = isFunction(errorMessage) ? errorMessage(error) : errorMessage
      if (error instanceof ServerError) {
        message = error.message || 'An error occurred'
      }
      toast.error(message)

      if (queryKey && rollbackOnError && context?.previousData && optimisticUpdate) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      if (onErrorCallback) {
        onErrorCallback(error)
      }
    },
    onSuccess: (data) => {
      if (successMessage) {
        const message = isFunction(successMessage) ? successMessage(data) : successMessage
        if (showSuccessToast) {
          toast.success(message)
        }
      }

      if (onSuccessCallback) {
        onSuccessCallback(data)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      if (additionalInvalidateQueries.length > 0) {
        additionalInvalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
  })
}

export default useAppMutation 