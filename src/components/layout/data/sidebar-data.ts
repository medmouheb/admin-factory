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
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Check Export',
          url: '/reapirage',
          icon: ShieldCheck,
        },
        {
          title: 'Retouch Packets',
          url: '/retouch-packets',
          icon: ListTodo,
        },
        {
          title: 'Quality Check',
          url: '/quality-check',
          icon: ClipboardCheck,
        },
        {
          title: 'Transfer Management',
          url: '/transfer-management',
          icon: Truck,
          roles: ['admin'],
        },
        {
          title: 'Tickets Done',
          url: '/help-center',
          icon: HelpCircle,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
          roles: ['admin', 'superviseur'],
        },
      ],
    },
  ],
}
