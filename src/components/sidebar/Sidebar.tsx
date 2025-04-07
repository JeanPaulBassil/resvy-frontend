'use client';

import {
  Accordion,
  AccordionItem,
  cn,
  Listbox,
  ListboxItem,
  ListboxSection,
  Tooltip,
  type ListboxProps,
  type ListboxSectionProps,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import React from 'react';

export enum SidebarItemType {
  Nest = 'nest',
}

export type SidebarItem = {
  key: string;
  title: string;
  icon?: string;
  href?: string;
  type?: SidebarItemType.Nest;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  items?: SidebarItem[];
  className?: string;
};

export type SidebarProps = Omit<ListboxProps<SidebarItem>, 'children'> & {
  items: SidebarItem[];
  isCompact?: boolean;
  hideEndContent?: boolean;
  iconClassName?: string;
  sectionClasses?: ListboxSectionProps['classNames'];
  classNames?: ListboxProps['classNames'];
  defaultSelectedKey: string;
  onSelect?: (key: string) => void;
};

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      items,
      isCompact,
      defaultSelectedKey,
      onSelect,
      hideEndContent,
      sectionClasses: sectionClassesProp = {},
      itemClasses: itemClassesProp = {},
      iconClassName,
      classNames,
      className,
      ...props
    },
    ref
  ) => {
    const [selected, setSelected] = React.useState<string>(defaultSelectedKey);

    const processedItems = React.useMemo(() => items, [items]);

    const sectionClasses = {
      ...sectionClassesProp,
      base: cn(sectionClassesProp?.base, 'w-full', {
        'p-0 max-w-[44px]': isCompact,
      }),
      group: cn(sectionClassesProp?.group, {
        'flex flex-col gap-1': isCompact,
      }),
      heading: cn(sectionClassesProp?.heading, {
        hidden: isCompact,
      }),
    };

    const itemClasses = {
      ...itemClassesProp,
      base: cn(itemClassesProp?.base, {
        'w-11 h-11 gap-0 p-0': isCompact,
      }),
    };

    const renderItem = React.useCallback(
      (item: SidebarItem) => {
        const isNestType =
          item.items && item.items?.length > 0 && item?.type === SidebarItemType.Nest;

        if (!isNestType) {
          return (
            <ListboxItem
              {...item}
              key={item.key}
              endContent={isCompact || hideEndContent ? null : (item.endContent ?? null)}
              startContent={
                isCompact ? null : item.icon ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Icon
                      className={cn(
                        'text-default-500 group-data-[selected=true]:text-foreground',
                        iconClassName
                      )}
                      icon={item.icon}
                      width={24}
                    />
                  </div>
                ) : (
                  (item.startContent ?? null)
                )
              }
              textValue={item.title}
              title={isCompact ? null : item.title}
            >
              {isCompact ? (
                <Tooltip content={item.title} placement="right">
                  <div className="flex w-full items-center justify-center">
                    {item.icon ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Icon
                          className={cn(
                            'text-default-500 group-data-[selected=true]:text-foreground',
                            iconClassName
                          )}
                          icon={item.icon}
                          width={24}
                        />
                      </div>
                    ) : (
                      (item.startContent ?? null)
                    )}
                  </div>
                </Tooltip>
              ) : null}
            </ListboxItem>
          );
        }

        // Handle nested items
        const cleanItem = { ...item, href: undefined };

        return (
          <ListboxItem
            {...cleanItem}
            key={cleanItem.key}
            classNames={{
              base: cn(
                {
                  'h-auto p-0': !isCompact && isNestType,
                },
                {
                  'inline-block w-11': isCompact && isNestType,
                }
              ),
            }}
            endContent={
              isCompact || isNestType || hideEndContent ? null : (cleanItem.endContent ?? null)
            }
            startContent={
              isCompact || isNestType ? null : cleanItem.icon ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <Icon
                    className={cn(
                      'text-default-500 group-data-[selected=true]:text-foreground',
                      iconClassName
                    )}
                    icon={cleanItem.icon}
                    width={24}
                  />
                </div>
              ) : (
                (cleanItem.startContent ?? null)
              )
            }
            title={isCompact || isNestType ? null : cleanItem.title}
          >
            {isCompact ? (
              <Tooltip content={cleanItem.title} placement="right">
                <div className="flex w-full items-center justify-center">
                  {cleanItem.icon ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Icon
                        className={cn(
                          'text-default-500 group-data-[selected=true]:text-foreground',
                          iconClassName
                        )}
                        icon={cleanItem.icon}
                        width={24}
                      />
                    </div>
                  ) : (
                    (cleanItem.startContent ?? null)
                  )}
                </div>
              </Tooltip>
            ) : null}
            {!isCompact && isNestType ? (
              <Accordion className={'p-0'}>
                <AccordionItem
                  key={cleanItem.key}
                  aria-label={cleanItem.title}
                  classNames={{
                    heading: 'pr-3',
                    trigger: 'p-0',
                    content: 'py-0 pl-4',
                  }}
                  title={
                    cleanItem.icon ? (
                      <div className={'flex h-11 items-center gap-2 px-2 py-1.5'}>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <Icon
                            className={cn(
                              'text-default-500 group-data-[selected=true]:text-foreground',
                              iconClassName
                            )}
                            icon={cleanItem.icon}
                            width={24}
                          />
                        </div>
                        <span className="text-small font-medium text-default-500 group-data-[selected=true]:text-foreground">
                          {cleanItem.title}
                        </span>
                      </div>
                    ) : (
                      (cleanItem.startContent ?? null)
                    )
                  }
                >
                  {cleanItem.items && cleanItem.items?.length > 0 ? (
                    <Listbox
                      className={'mt-0.5'}
                      classNames={{
                        list: cn('border-l border-default-200 pl-4'),
                      }}
                      items={cleanItem.items}
                      variant="flat"
                    >
                      {cleanItem.items.map(renderItem)}
                    </Listbox>
                  ) : null}
                </AccordionItem>
              </Accordion>
            ) : null}
          </ListboxItem>
        );
      },
      [isCompact, hideEndContent, iconClassName]
    );

    return (
      <Listbox
        key={isCompact ? 'compact' : 'default'}
        ref={ref}
        hideSelectedIcon
        as="nav"
        aria-label="Sidebar Navigation"
        className={cn('list-none', className)}
        classNames={{
          ...classNames,
          list: cn('items-center', classNames?.list),
        }}
        color="default"
        itemClasses={{
          ...itemClasses,
          base: cn('px-3 min-h-11 rounded-md h-[44px]', itemClasses?.base),
          title: cn(
            'text-small font-medium text-default-500 group-data-[selected=true]:text-foreground',
            itemClasses?.title
          ),
        }}
        items={processedItems}
        selectedKeys={[selected]}
        selectionMode="single"
        variant="flat"
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0];
          setSelected(key as string);
          onSelect?.(key as string);
        }}
        {...props}
      >
        {(item) => {
          return item.items && item.items?.length > 0 && item?.type === SidebarItemType.Nest ? (
            renderItem(item)
          ) : item.items && item.items?.length > 0 ? (
            <ListboxSection
              key={item.key}
              classNames={sectionClasses}
              showDivider={isCompact}
              title={item.title}
            >
              {item.items.map(renderItem)}
            </ListboxSection>
          ) : (
            renderItem(item)
          );
        }}
      </Listbox>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;
