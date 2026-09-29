import { equipment, projects, services, shopItems } from '@/data/catalog';
// Replace this adapter with Supabase queries when the content editor is introduced.
export const contentRepository = { services: () => services.filter(s => s.enabled), projects: () => projects, equipment: () => equipment, shop: () => shopItems };
