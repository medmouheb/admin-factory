import {
  LayoutDashboard,
  ListTodo,
  HelpCircle,
  Users,
  ShieldCheck,
  AudioWaveform,
  Command,
  ClipboardCheck,
  Truck,
  ArrowRightLeft,
  FileText,
  Box,
  ScrollText,
} from 'lucide-react'

import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Abderrahmen',
    email: 'Abderrahmendev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Tesca Tunisie',
      logo: Command,
      plan: '',
    },
  ],
  navGroups: [
    {
      title: 'sidebar.general', // Translation key
      items: [
        {
          title: 'sidebar.dashboard',
          url: '/',
          icon: LayoutDashboard,
          roles: ['superviseur', 'admin', 'manager'],
        },
        {
          title: 'sidebar.checkExport',
          url: '/reapirage',
          icon: ShieldCheck,
          roles: ['operateur', 'superviseur', 'admin', 'manager'],
        },
        {
          title: 'sidebar.retouchPackets',
          url: '/retouch-packets',
          icon: ListTodo,
          roles: ['manager'],
        },
        {
          title: 'sidebar.qualityCheck',
          url: '/quality-check',
          icon: ClipboardCheck,
          roles: ['manager'],
        },
        {
          title: 'sidebar.transferManagement',
          url: '/transfer-management',
          icon: Truck,
          roles: ['manager'],
        },
        {
          title: 'sidebar.ticketsDone',
          url: '/tickets-done',
          icon: HelpCircle,
          roles: ['operateur', 'superviseur', 'admin', 'manager'],
        },
        {
          title: 'sidebar.users',
          url: '/users',
          icon: Users,
          roles: ['superviseur', 'admin', 'manager'],
        },
        {
          title: 'sidebar.exportImport',
          url: '/export-import',
          icon: ArrowRightLeft,
          roles: ['admin', 'manager'],
        },
        {
          title: 'sidebar.references',
          url: '/references',
          icon: FileText,
          roles: ['admin', 'manager', 'superviseur',],
        },
        {
          title: 'sidebar.materials',
          url: '/materials',
          icon: Box,
          roles: ['admin', 'manager', 'superviseur'],
        },
        {
          title: 'sidebar.logs',
          url: '/logs',
          icon: ScrollText,
          roles: ['admin', 'manager'],
        },
      ],
    },
  ],
}
