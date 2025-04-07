'use client'
import React from 'react'
import { TableProps as NextUITableProps, Pagination, Spinner, Tooltip } from '@heroui/react'
import {
  Table as NextUITable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from '@heroui/react'
import clsx from 'clsx'

type ActionColumn = {
  key: 'actions'
  label: string
}

type TextColumn = {
  key: string
  label: string
}

type Column = TextColumn | ActionColumn

type Action<C extends readonly Column[]> = {
  label: string
  icon: React.ReactNode
  showTooltip?: boolean
  tooltipColor?:
    | 'danger'
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'foreground'
  componentClassname?: string
  onClick: (row: Row<C>, e?: React.MouseEvent) => void
}

// Define the Row type based on the Columns:
// - If it's an action column, the property is Action[]
// - Otherwise, it's React.ReactNode
export type Row<C extends readonly Column[]> = {
  id: number
} & {
  [Col in C[number] as Col['key']]: Col extends { key: 'actions' } ? Action<C>[] : React.ReactNode
}

type TableProps<C extends readonly Column[]> = NextUITableProps & {
  columns: C
  rows: Row<C>[]
  setPage: (page: number) => void
  currentPage: number
  isLoading: boolean
  totalPages: number
  emptyContent?: string | React.ReactNode
  ariaLabel?: string
  tableLayout?: 'auto' | 'fixed'
  onRowClick?: (row: Row<C>) => void
}

const Table = <C extends readonly Column[]>({
  columns,
  rows,
  setPage,
  currentPage,
  isLoading,
  totalPages,
  emptyContent,
  ariaLabel,
  tableLayout = 'fixed',
  onRowClick,
}: TableProps<C>) => {
  const columnsArray = [...columns]
  const pages = totalPages

  return (
    <NextUITable
      isCompact
      layout={tableLayout}
      removeWrapper
      aria-label={ariaLabel}
      bottomContentPlacement="outside"
      isHeaderSticky
      classNames={{
        wrapper: ['max-w-3xl'],
        tr: ['!rounded-none'],
        th: [
          'py-2',
          'pl-8',
          '!rounded-none',
          'text-small font-semibold text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-900 border-b-2 border-primary-50 dark:border-secondary-700',
        ],
        td: ['py-2.5 pl-8 text-small'],
      }}
      isStriped={true}
      className="min-h-72 flex-1 overflow-x-auto"
      bottomContent={
        pages > 1 ? (
          <div className="flex w-full justify-center">
            <Pagination
              total={totalPages}
              initialPage={1}
              className="m-4"
              page={currentPage}
              variant="flat"
              color="primary"
              showShadow={false}
              size="sm"
              classNames={{
                prev: 'bg-secondary-50 dark:bg-secondary-950',
                next: 'bg-secondary-50  dark:bg-secondary-950',
                item: 'bg-secondary-50 dark:bg-secondary-950',
                cursor: 'dark:bg-primary bg-primary-500',
                wrapper: 'shadow-none',
              }}
              isCompact
              showControls
              onChange={(page) => setPage(page)}
            />
          </div>
        ) : null
      }
    >
      <TableHeader columns={columnsArray}>
        {(column) => (
          <TableColumn key={column.key} align="start">
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent={emptyContent || 'No data found'}
        items={rows}
        isLoading={isLoading}
        loadingContent={
          <div className="flex items-center justify-center space-x-2">
            <Spinner size="sm" />
            <span>Loading...</span>
          </div>
        }
      >
        {(item) => (
          <TableRow
            key={item.id}
            className={clsx(
              'bg-white data-[odd=true]:bg-secondary-50/80 dark:bg-secondary-900 dark:data-[odd=true]:bg-secondary-950/20',
              {
                'cursor-pointer hover:bg-secondary-200/50 hover:data-[odd=true]:bg-secondary-200/50 dark:hover:bg-secondary-950':
                  Boolean(onRowClick),
              }
            )}
            onClick={() => onRowClick?.(item)}
            tabIndex={onRowClick ? 0 : undefined}
            role={onRowClick ? 'button' : undefined}
          >
            {columnsArray.map((column) => {
              if (column.key === 'actions') {
                const actions = getKeyValue(item, column.key) as Action<C>[]
                return (
                  <TableCell key={column.key}>
                    <div className="flex flex-row space-x-2">
                      {actions.map((action: Action<C>) => {
                        const inner = (
                          <button key={action.label} onClick={(e) => action.onClick(item, e)}>
                            <span className="sr-only">{action.label}</span>
                            <div
                              className={clsx(
                                'rounded-md px-2 py-1 hover:bg-secondary-100 dark:hover:bg-secondary-800',
                                action.componentClassname ?? ''
                              )}
                            >
                              {action.icon}
                            </div>
                          </button>
                        )

                        if (action.showTooltip === undefined || action.showTooltip) {
                          return (
                            <Tooltip
                              key={action.label}
                              content={action.label}
                              color={action.tooltipColor ?? 'primary'}
                              delay={500}
                              placement="top"
                            >
                              {inner}
                            </Tooltip>
                          )
                        } else {
                          return inner
                        }
                      })}
                    </div>
                  </TableCell>
                )
              } else {
                const cellValue = getKeyValue(item, column.key) as React.ReactNode
                return <TableCell key={column.key}>{cellValue}</TableCell>
              }
            })}
          </TableRow>
        )}
      </TableBody>
    </NextUITable>
  )
}

export default Table
