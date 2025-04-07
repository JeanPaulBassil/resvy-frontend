import { ROUTES } from '@/constants/routes';

import { SidebarItem } from './Sidebar';
import TeamAvatar from './team-avatar';

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

// Common UI elements
// const AddIcon = (
//   <Icon
//     className="text-default-400"
//     icon="solar:add-circle-line-duotone"
//     width={24}
//   />
// )

// const NewChip = (
//   <Chip size="sm" variant="flat">
//     New
//   </Chip>
// )

// const PerksChip = (
//   <Chip size="sm" variant="flat">
//     3
//   </Chip>
// )

// // Helper function for creating nested items
// const createNestedItem = (
//   key: string,
//   title: string,
//   icon: string,
//   subItems: SidebarItem[],
// ): SidebarItem => ({
//   key,
//   title,
//   icon,
//   type: SidebarItemType.Nest,
//   items: subItems,
// })

// Base items that are commonly used
const baseItems: SidebarItem[] = [
  {
    key: 'home',
    href: ROUTES.HOME,
    icon: 'solar:home-2-linear',
    title: 'Home',
  },
  // {
  //   key: 'floor-plan',
  //   href: ROUTES.FLOOR_PLAN,
  //   icon: 'solar:widget-2-outline',
  //   title: 'Floor Plan',
  // },
  // {
  //   key: "projects",
  //   href: ROUTES.PROJECTS,
  //   icon: "solar:widget-2-outline",
  //   title: "Projects",
  //   endContent: AddIcon,
  // },
  // {
  //   key: "tasks",
  //   href: ROUTES.TASKS,
  //   icon: "solar:checklist-minimalistic-outline",
  //   title: "Tasks",
  //   endContent: AddIcon,
  // },
  // {
  //   key: "team",
  //   href: ROUTES.TEAM,
  //   icon: "solar:users-group-two-rounded-outline",
  //   title: "Team",
  // },
  // {
  //   key: "tracker",
  //   href: ROUTES.TRACKER,
  //   icon: "solar:sort-by-time-linear",
  //   title: "Tracker",
  //   endContent: NewChip,
  // },
  // {
  //   key: "analytics",
  //   href: ROUTES.ANALYTICS,
  //   icon: "solar:chart-outline",
  //   title: "Analytics",
  // },
  // {
  //   key: "perks",
  //   href: ROUTES.PERKS,
  //   icon: "solar:gift-linear",
  //   title: "Perks",
  //   endContent: PerksChip,
  // },
  // {
  //   key: "expenses",
  //   href: ROUTES.EXPENSES,
  //   icon: "solar:bill-list-outline",
  //   title: "Expenses",
  // },
  // {
  //   key: "settings",
  //   href: ROUTES.SETTINGS,
  //   icon: "solar:settings-outline",
  //   title: "Settings",
  // },
];

export const items: SidebarItem[] = baseItems;

export const sectionItems: SidebarItem[] = [
  {
    key: 'overview',
    title: 'Overview',
    items: baseItems.slice(0, 5), // Only include the first 5 items
  },
  // {
  //   key: 'organization',
  //   title: 'Organization',
  //   items: [
  //     createNestedItem('cap_table', 'Cap Table', 'solar:pie-chart-2-outline', [
  //       {
  //         key: 'shareholders',
  //         href: ROUTES.CAP_TABLE.SHAREHOLDERS,
  //         title: 'Shareholders',
  //         icon: 'solar:users-group-rounded-linear',
  //       },
  //       {
  //         key: 'note_holders',
  //         href: ROUTES.CAP_TABLE.NOTE_HOLDERS,
  //         title: 'Note Holders',
  //         icon: 'solar:notes-outline',
  //       },
  //       {
  //         key: 'transactions_log',
  //         href: ROUTES.CAP_TABLE.TRANSACTIONS,
  //         title: 'Transactions Log',
  //         icon: 'solar:clipboard-list-linear',
  //       },
  //     ]),
  //     {
  //       key: 'analytics',
  //       href: ROUTES.ANALYTICS,
  //       icon: 'solar:chart-outline',
  //       title: 'Analytics',
  //     },
  //     {
  //       key: 'perks',
  //       href: ROUTES.PERKS,
  //       icon: 'solar:gift-linear',
  //       title: 'Perks',
  //       endContent: PerksChip,
  //     },
  //     {
  //       key: 'expenses',
  //       href: ROUTES.EXPENSES,
  //       icon: 'solar:bill-list-outline',
  //       title: 'Expenses',
  //     },
  //     {
  //       key: 'settings',
  //       href: ROUTES.SETTINGS,
  //       icon: 'solar:settings-outline',
  //       title: 'Settings',
  //     },
  //   ],
  // },
];

export const sectionItemsWithTeams: SidebarItem[] = [
  ...sectionItems,
  {
    key: 'your-teams',
    title: 'Your Teams',
    items: [
      {
        key: 'heroui',
        href: '#',
        title: 'HeroUI',
        startContent: <TeamAvatar name="Hero UI" />,
      },
      {
        key: 'tailwind-variants',
        href: '#',
        title: 'Tailwind Variants',
        startContent: <TeamAvatar name="Tailwind Variants" />,
      },
      {
        key: 'heroui-pro',
        href: '#',
        title: 'HeroUI Pro',
        startContent: <TeamAvatar name="HeroUI Pro" />,
      },
    ],
  },
];

export const sectionLongList: SidebarItem[] = [
  ...sectionItems,
  {
    key: 'payments',
    title: 'Payments',
    items: [
      {
        key: 'payroll',
        href: '#',
        title: 'Payroll',
        icon: 'solar:dollar-minimalistic-linear',
      },
      {
        key: 'invoices',
        href: '#',
        title: 'Invoices',
        icon: 'solar:file-text-linear',
      },
      {
        key: 'billing',
        href: '#',
        title: 'Billing',
        icon: 'solar:card-outline',
      },
      {
        key: 'payment-methods',
        href: '#',
        title: 'Payment Methods',
        icon: 'solar:wallet-money-outline',
      },
      {
        key: 'payouts',
        href: '#',
        title: 'Payouts',
        icon: 'solar:card-transfer-outline',
      },
    ],
  },
  {
    key: 'your-teams',
    title: 'Your Teams',
    items: [
      {
        key: 'heroui',
        href: '#',
        title: 'HeroUI',
        startContent: <TeamAvatar name="Hero UI" />,
      },
      {
        key: 'tailwind-variants',
        href: '#',
        title: 'Tailwind Variants',
        startContent: <TeamAvatar name="Tailwind Variants" />,
      },
      {
        key: 'heroui-pro',
        href: '#',
        title: 'HeroUI Pro',
        startContent: <TeamAvatar name="HeroUI Pro" />,
      },
    ],
  },
];

export const sectionNestedItems: SidebarItem[] = [
  {
    key: 'home',
    href: ROUTES.HOME,
    icon: 'solar:home-2-linear',
    title: 'Home',
  },
  // {
  //   key: 'projects',
  //   href: ROUTES.PROJECTS,
  //   icon: 'solar:widget-2-outline',
  //   title: 'Projects',
  //   endContent: AddIcon,
  // },
  // {
  //   key: 'tasks',
  //   href: ROUTES.TASKS,
  //   icon: 'solar:checklist-minimalistic-outline',
  //   title: 'Tasks',
  //   endContent: AddIcon,
  // },
  // {
  //   key: 'team',
  //   href: ROUTES.TEAM,
  //   icon: 'solar:users-group-two-rounded-outline',
  //   title: 'Team',
  // },
  // {
  //   key: 'tracker',
  //   href: ROUTES.TRACKER,
  //   icon: 'solar:sort-by-time-linear',
  //   title: 'Tracker',
  //   endContent: NewChip,
  // },
  // {
  //   key: 'analytics',
  //   href: ROUTES.ANALYTICS,
  //   icon: 'solar:chart-outline',
  //   title: 'Analytics',
  // },
  // {
  //   key: 'perks',
  //   href: ROUTES.PERKS,
  //   icon: 'solar:gift-linear',
  //   title: 'Perks',
  //   endContent: PerksChip,
  // },
  // {
  //   key: 'cap_table',
  //   title: 'Cap Table',
  //   icon: 'solar:pie-chart-2-outline',
  //   type: SidebarItemType.Nest,
  //   items: [
  //     {
  //       key: 'shareholders',
  //       icon: 'solar:users-group-rounded-linear',
  //       href: ROUTES.CAP_TABLE.SHAREHOLDERS,
  //       title: 'Shareholders',
  //     },
  //     {
  //       key: 'note_holders',
  //       icon: 'solar:notes-outline',
  //       href: ROUTES.CAP_TABLE.NOTE_HOLDERS,
  //       title: 'Note Holders',
  //     },
  //     {
  //       key: 'transactions_log',
  //       icon: 'solar:clipboard-list-linear',
  //       href: ROUTES.CAP_TABLE.TRANSACTIONS,
  //       title: 'Transactions Log',
  //     },
  //   ],
  // },
  // {
  //   key: 'expenses',
  //   href: ROUTES.EXPENSES,
  //   icon: 'solar:bill-list-outline',
  //   title: 'Expenses',
  // },
];
