import type { Equipment, RentalLine } from '@/types/domain';
export function normalizeRentalLines(value: unknown, catalog: Equipment[]): RentalLine[] { if (!Array.isArray(value))
    return []; const result: RentalLine[] = []; for (const line of value) {
    if (!line || typeof line !== 'object')
        continue;
    const item = catalog.find(e => e.id === line.equipmentId);
    if (!item || item.availability === 'Unavailable' || !Number.isInteger(line.quantity) || line.quantity < 1 || result.some(x => x.equipmentId === item.id))
        continue;
    result.push({ equipmentId: item.id, quantity: Math.min(line.quantity, item.quantity) });
} return result; }
