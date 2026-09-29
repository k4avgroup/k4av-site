'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { inquirySchema, serviceOptions } from '@/lib/validation';
import type { InquiryInput } from '@/lib/validation';
import type { RentalLine } from '@/types/domain';
import { Turnstile } from './turnstile';
import { currentRentalDate } from '@/lib/dates';
type Props = {
    kind: InquiryInput['kind'];
    items?: RentalLine[];
    shopItemId?: string;
    defaultService?: string;
    context?: string;
    onSuccess?: () => void;
};
export function InquiryForm({ kind, items = [], shopItemId, defaultService, context = '', onSuccess }: Props) {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState<{
        id: string;
        mode: string;
    } | null>(null);
    const [token, setToken] = useState('');
    const [attempt, setAttempt] = useState(0);
    const started = useRef(0);
    const status = useRef<HTMLDivElement>(null);
    useEffect(() => { started.current = Date.now(); }, []);
    useEffect(() => { if (success)
        status.current?.focus(); }, [success]);
    const rental = kind === 'rental';
    async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (busy)
        return; setError(''); const form = e.currentTarget; const values = Object.fromEntries(new FormData(form)); const parsed = inquirySchema.safeParse({ ...values, kind, items, shopItemId, startedAt: started.current, turnstileToken: token }); if (!parsed.success) {
        const fields = parsed.error.flatten().fieldErrors;
        setErrors(fields);
        const first = Object.keys(fields)[0];
        form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
    } setErrors({}); setBusy(true); try {
        const res = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
        const body = await res.json();
        if (!res.ok) {
            setErrors(body.fields || {});
            throw new Error(body.error || 'Unable to submit. Please try again.');
        }
        setSuccess(body);
        onSuccess?.();
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to submit. Please try again.');
        setToken('');
        setAttempt(a => a + 1);
    }
    finally {
        setBusy(false);
    } }
    if (success)
        return <div className="form-success" ref={status} tabIndex={-1} role="status"><CheckCircle2 size={30}/><h2>{success.mode === 'local' ? 'Test request saved locally.' : 'Request received.'}</h2><p>{success.mode === 'local' ? 'This development request is saved on this computer. It has not been sent to K4 AV Group.' : 'Thank you for the details. Your inquiry is saved for review. This does not confirm equipment availability, pricing or a booking.'}</p><p>Reference: <strong>{success.id.slice(0, 8).toUpperCase()}</strong></p><button className="button secondary" onClick={() => { setSuccess(null); started.current = Date.now(); setToken(''); setAttempt(a => a + 1); }}>Start another inquiry</button></div>;
    function field(name: string, label: string, type = 'text', required = false, full = false) { return <label className={`field ${full ? 'full' : ''}`} key={name}>{label}{required ? ' *' : ''}<input name={name} type={type} required={required} maxLength={name === 'email' ? 254 : 200} autoComplete={name === 'name' ? 'name' : name === 'company' ? 'organization' : name === 'email' ? 'email' : name === 'phone' ? 'tel' : undefined} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name][0]}</span>}</label>; }
    return <form className={`form ${rental ? 'compact' : ''}`} onSubmit={submit} aria-label={`${kind} inquiry form`}>
 <div className="honey" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 {field('name', 'Full name', 'text', true)}{field('company', 'Company')}{field('email', 'Email', 'email', true)}{field('phone', 'Phone', 'tel', rental)}
 {kind === 'quote' && <><label className="field full">Service needed *<select name="service" required defaultValue={serviceOptions.includes(defaultService as typeof serviceOptions[number]) ? defaultService : ''} aria-invalid={Boolean(errors.service)}><option value="" disabled>Select a service</option>{serviceOptions.map(x => <option key={x}>{x}</option>)}</select>{errors.service && <span className="field-error">{errors.service[0]}</span>}</label>{field('location', 'Project location', 'text', true)}{field('timeline', 'Desired date / timeline', 'text', true)}<label className="field">Budget range (optional)<select name="budget" defaultValue=""><option value="">Select a range</option>{['Under $2,500', '$2,500–$10,000', '$10,000–$25,000', '$25,000+', 'To be discussed'].map(x => <option key={x}>{x}</option>)}</select></label></>}
 {rental && <><label className="field">Rental start date *<input name="startDate" type="date" required min={currentRentalDate()} aria-invalid={Boolean(errors.startDate)}/>{errors.startDate && <span className="field-error">{errors.startDate[0]}</span>}</label><label className="field">Rental end date *<input name="endDate" type="date" required min={currentRentalDate()} aria-invalid={Boolean(errors.endDate)}/>{errors.endDate && <span className="field-error">{errors.endDate[0]}</span>}</label><label className="field">Pickup / delivery *<select name="fulfillment" defaultValue="Pickup"><option>Pickup</option><option>Delivery</option></select></label></>}
 <label className="field">Preferred contact method<select name="preferredContact" defaultValue="Email"><option>Email</option><option>Phone</option></select></label>
 <label className="field full">{rental ? 'Notes (optional)' : kind === 'quote' ? 'Project description *' : 'How can we help? *'}<textarea name="message" required={!rental} minLength={rental ? undefined : 15} maxLength={6000} defaultValue={context} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined}/>{errors.message && <span id="message-error" className="field-error">{errors.message[0]}</span>}</label>
 {kind === 'quote' && <div className="upload-placeholder full">Drawings or equipment lists? Mention them in your description. File uploads will be available in a later phase; we can arrange a transfer after contact.</div>}
 {errors.items && <p role="alert" className="field-error full">{errors.items[0]}</p>}{error && <div className="form-error full" role="alert">{error}</div>}
 <Turnstile onToken={setToken} attempt={attempt}/><p className="form-note full">* Required. By submitting, you agree to be contacted about this inquiry. See our <Link className="text-link" href="/privacy">Privacy Policy</Link>. A request does not confirm a reservation.</p>
 <button type="submit" className="button full" disabled={busy || (rental && !items.length)}>{busy ? 'Saving request…' : rental ? 'Submit rental request' : kind === 'quote' ? 'Send quote request' : 'Send inquiry'}<ArrowUpRight size={17}/></button>
 </form>;
}
