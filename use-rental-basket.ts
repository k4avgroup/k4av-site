'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { normalizeRentalLines } from './rental';
import type { Equipment, RentalLine } from '@/types/domain';
const key = 'k4-rental-v1';
let fallback = '[]';
function getSnapshot() { try {
    return localStorage.getItem(key) || fallback;
}
catch {
    return fallback;
} }
function subscribe(callback: () => void) { window.addEventListener('storage', callback); window.addEventListener('k4-basket', callback); return () => { window.removeEventListener('storage', callback); window.removeEventListener('k4-basket', callback); }; }
export function useRentalBasket(equipment: Equipment[]): [
    RentalLine[],
    (value: RentalLine[] | ((old: RentalLine[]) => RentalLine[])) => void
] { const raw = useSyncExternalStore(subscribe, getSnapshot, () => '[]'); const lines = useMemo(() => { try {
    return normalizeRentalLines(JSON.parse(raw), equipment);
}
catch {
    return [];
} }, [raw, equipment]); function setLines(value: RentalLine[] | ((old: RentalLine[]) => RentalLine[])) { const next = typeof value === 'function' ? value(lines) : value; fallback = JSON.stringify(normalizeRentalLines(next, equipment)); try {
    localStorage.setItem(key, fallback);
}
catch { } window.dispatchEvent(new Event('k4-basket')); } return [lines, setLines]; }
