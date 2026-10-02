import test from 'node:test';
import assert from 'node:assert/strict';
import { inquirySchema } from '../lib/validation.ts';
import { normalizeRentalLines } from '../lib/rental.ts';
import type { Equipment } from '../types/domain.ts';

// Test fixtures only. The shipped catalog is empty until real equipment is added.
const equipment: Equipment[] = [1, 2].map((n) => ({
  id: `demo-${n}`,
  manufacturer: 'Test',
  model: `Test item ${n}`,
  category: 'Audio',
  description: 'Fixture',
  specifications: [],
  image: null,
  dailyPrice: null,
  weeklyPrice: null,
  quantity: 4,
  availability: 'On request',
  condition: 'Test',
  sample: true,
}));
const base = {
  kind: 'contact',
  topic: 'General question',
  name: 'Test Visitor',
  email: 'visitor@example.com',
  message: 'This is a local verification request.',
  startedAt: Date.now() - 5000,
};
test('contact accepts valid content and trims names', () => {
  const result = inquirySchema.parse({ ...base, name: '  Test Visitor  ' });
  assert.equal(result.name, 'Test Visitor');
});
test('quote requires a service and a description', () => {
  const result = inquirySchema.safeParse({ ...base, kind: 'quote' });
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(result.error.issues.map((x) => x.path[0]).sort(), ['service']);
});
test('contact requires a topic', () => {
  const result = inquirySchema.safeParse({ ...base, topic: '' });
  assert.equal(result.success, false);
  if (!result.success)
    assert.deepEqual(
      result.error.issues.map((x) => x.path[0]),
      ['topic'],
    );
});
test('rental rejects reverse dates, duplicate lines and missing phone', () => {
  const result = inquirySchema.safeParse({
    ...base,
    kind: 'rental',
    startDate: '2099-05-05',
    endDate: '2099-05-01',
    fulfillment: 'Pickup',
    items: [
      { equipmentId: 'demo-1', quantity: 1 },
      { equipmentId: 'demo-1', quantity: 1 },
    ],
  });
  assert.equal(result.success, false);
  if (!result.success)
    assert.deepEqual(result.error.issues.map((x) => x.path[0]).sort(), ['endDate', 'items', 'phone']);
});
test('rental accepts same-day rental and notes are optional', () =>
  assert.equal(
    inquirySchema.safeParse({
      ...base,
      kind: 'rental',
      phone: '206 555 0100',
      message: '',
      startDate: '2099-05-05',
      endDate: '2099-05-05',
      fulfillment: 'Delivery',
      items: [{ equipmentId: 'demo-1', quantity: 2 }],
    }).success,
    true,
  ));
test('validation rejects impossible calendar dates and fractional quantity', () =>
  assert.equal(
    inquirySchema.safeParse({
      ...base,
      kind: 'rental',
      phone: '206 555 0100',
      startDate: '2099-02-31',
      endDate: '2099-03-03',
      fulfillment: 'Pickup',
      items: [{ equipmentId: 'demo-1', quantity: 1.5 }],
    }).success,
    false,
  ));
test('phone preference requires a phone and email must be valid', () => {
  assert.equal(inquirySchema.safeParse({ ...base, preferredContact: 'Phone' }).success, false);
  assert.equal(inquirySchema.safeParse({ ...base, email: 'not-an-email' }).success, false);
});
test('restored basket rejects unknown data, merges no duplicate IDs and caps stock', () =>
  assert.deepEqual(
    normalizeRentalLines(
      [
        null,
        { equipmentId: 'not-real', quantity: 1 },
        { equipmentId: 'demo-1', quantity: 999 },
        { equipmentId: 'demo-1', quantity: 1 },
        { equipmentId: 'demo-2', quantity: -1 },
      ],
      equipment,
    ),
    [{ equipmentId: 'demo-1', quantity: 4 }],
  ));
import { currentRentalDate } from '../lib/dates.ts';
test('Seattle rental date remains today after UTC midnight', () =>
  assert.equal(currentRentalDate(new Date('2026-09-24T03:30:00Z')), '2026-09-23'));
