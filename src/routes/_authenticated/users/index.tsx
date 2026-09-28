import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.coerce.number().optional().catch(1),
  pageSize: z.coerce.number().optional().catch(10),
  // Facet filters
  status: z.array(z.string()).optional().catch([]),
  role: z.array(z.string()).optional().catch([]),
  phone: z.array(z.string()).optional().catch([]),
  email: z.array(z.string()).optional().catch([]),
  // Search text filter
  username: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
