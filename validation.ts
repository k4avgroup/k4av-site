import { z } from 'zod';
import { currentRentalDate } from './dates.ts';
export const serviceOptions = ['AV Commissioning', 'AV Programming', 'Installation Support', 'Troubleshooting', 'Live Event Audio', 'Event Technical Support', 'Equipment Rental', 'Other'] as const;
const short = z.string().trim().max(200);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date').refine(v => { const d = new Date(v); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; }, 'Choose a valid date');
export const inquirySchema = z.object({
    kind: z.enum(['quote', 'contact', 'rental', 'shop']), name: z.string().trim().min(2, 'Enter your full name').max(100), company: short.default(''), email: z.email('Enter a valid email address').max(254), phone: z.string().trim().max(40).refine(v => !v || (/^[+()\d.\s-]+$/.test(v) && v.replace(/\D/g, '').length >= 7), 'Enter a valid phone number').default(''), message: z.string().trim().max(6000).default(''), service: z.enum(serviceOptions).optional(), location: short.default(''), timeline: short.default(''), budget: short.default(''), preferredContact: z.enum(['Email', 'Phone']).default('Email'), startDate: date.optional(), endDate: date.optional(), fulfillment: z.enum(['Pickup', 'Delivery']).optional(), items: z.array(z.object({ equipmentId: z.string().max(80), quantity: z.number().int().min(1).max(100) })).max(50).default([]), shopItemId: z.string().max(100).optional(), website: z.string().max(200).default(''), startedAt: z.number().finite(), turnstileToken: z.string().max(2048).optional()
}).superRefine((v, c) => {
    const issue = (path: string, message: string) => c.addIssue({ code: 'custom', path: [path], message });
    if (v.preferredContact === 'Phone' && !v.phone)
        issue('phone', 'A phone number is required for phone contact');
    if (v.kind !== 'rental' && v.message.length < 15)
        issue('message', 'Please provide at least 15 characters');
    if (v.kind === 'quote') {
        if (!v.service)
            issue('service', 'Select a service');
        if (!v.location)
            issue('location', 'Enter the project location');
        if (!v.timeline)
            issue('timeline', 'Tell us your desired date or timeline');
    }
    if (v.kind === 'shop' && !v.shopItemId)
        issue('shopItemId', 'Select a shop item');
    if (v.kind === 'rental') {
        if (!v.phone)
            issue('phone', 'Enter a phone number');
        if (!v.startDate)
            issue('startDate', 'Choose a start date');
        if (!v.endDate)
            issue('endDate', 'Choose an end date');
        if (v.startDate && v.startDate < currentRentalDate())
            issue('startDate', 'Choose today or a future date');
        if (v.startDate && v.endDate && v.endDate < v.startDate)
            issue('endDate', 'End date must be on or after start date');
        if (!v.fulfillment)
            issue('fulfillment', 'Choose pickup or delivery');
        if (!v.items.length)
            issue('items', 'Add at least one equipment item');
        if (new Set(v.items.map(i => i.equipmentId)).size !== v.items.length)
            issue('items', 'Each equipment item may appear only once');
    }
});
export type InquiryInput = z.infer<typeof inquirySchema>;
