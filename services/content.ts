import { equipment, projects, services, shopItems } from '@/data/catalog';
import { industries } from '@/data/site';
import type { Layer } from '@/types/domain';

// Replace this adapter with Supabase queries when the content editor is introduced.
export const contentRepository = {
  services: (layer?: Layer) => services.filter((s) => s.enabled && (!layer || s.layer === layer)),
  projects: (layer?: Layer) => projects.filter((p) => !layer || p.layer === layer),
  industries: (layer?: Layer) => industries.filter((i) => !layer || i.layers.includes(layer)),
  equipment: () => equipment,
  shop: () => shopItems,
};
