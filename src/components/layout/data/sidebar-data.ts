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
    /*  {
         name: 'Acme Inc',
         logo: GalleryVerticalEnd,
         plan: 'Enterprise',
       },*/

  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
          roles: ['superviseur', 'admin', 'manager'],
        },
        {
          title: 'Check Export',
          url: '/reapirage',
          icon: ShieldCheck,
          roles: ['operateur', 'superviseur', 'admin', 'manager'],
        },
        {
          title: 'Retouch Packets',
          url: '/retouch-packets',
          icon: ListTodo,
          roles: ['manager'],
        },
        {
          title: 'Quality Check',
          url: '/quality-check',
          icon: ClipboardCheck,
          roles: ['manager'],
        },
        {
          title: 'Transfer Management',
          url: '/transfer-management',
          icon: Truck,
          roles: ['manager'],
        },
        {
          title: 'Tickets Done',
          url: '/help-center',
          icon: HelpCircle,
          roles: ['operateur', 'superviseur', 'admin', 'manager'],
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
          roles: ['superviseur', 'admin', 'manager'],
        },
        {
          title: 'Export Import',
          url: '/export-import',
          icon: ArrowRightLeft,
          roles: ['admin', 'manager'],
        },
        {
          title: 'References',
          url: '/references',
          icon: FileText,
          roles: ['admin', 'manager', 'superviseur',],
        },
        {
          title: 'Materials',
          url: '/materials',
          icon: Box,
          roles: ['admin', 'manager', 'superviseur'],
        },
        {
          title: 'Logs',
          url: '/logs',
          icon: ScrollText,
          roles: ['admin', 'manager'],
        },
      ],
    },
  ],
}
