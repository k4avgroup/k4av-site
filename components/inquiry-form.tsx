'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
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
  division?: 'integration' | 'events';
  onSuccess?: () => void;
};
const projectTypes = ['New installation', 'Upgrade', 'Commissioning', 'Programming', 'Troubleshooting', 'Other'];
const eventTypeOptions = [
  'Corporate meeting',
  'Conference',
  'General session',
  'Luncheon or dinner',
  'Gala or celebration',
  'Hybrid or streaming',
  'Other',
];
const contactTopics = [
  'General question',
  'Partnership or collaboration',
  'Offering services or products',
  'Work with K4 AV Group',
  'Press or media',
  'Something else',
];
const eventNeeds = ['Audio', 'Video', 'Projection', 'Equipment rental', 'Technical labor'];
export function InquiryForm({
  kind,
  items = [],
  shopItemId,
  defaultService,
  context = '',
  division,
  onSuccess,
}: Props) {
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
  useEffect(() => {
    started.current = Date.now();
  }, []);
  useEffect(() => {
    if (success) status.current?.focus();
  }, [success]);
  const rental = kind === 'rental';
  const quoteKind = kind === 'quote' || kind === 'contact';
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError('');
    const form = e.currentTarget;
    const data = new FormData(form);
    const values = Object.fromEntries(data);
    const parsed = inquirySchema.safeParse({
      ...values,
      needs: data.getAll('needs'),
      division,
      kind,
      items,
      shopItemId,
      startedAt: started.current,
      turnstileToken: token,
    });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors(fields);
      const first = Object.keys(fields)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();
      if (!res.ok) {
        setErrors(body.fields || {});
        throw new Error(body.error || 'Unable to submit. Please try again.');
      }
      setSuccess(body);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit. Please try again.');
      setToken('');
      setAttempt((a) => a + 1);
    } finally {
      setBusy(false);
    }
  }
  // Until the inquiry storage (Supabase) and spam protection are set up, the live site shows a notice instead of a form that cannot send.
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_FORMS_ENABLED !== 'true')
    return (
      <div className="form-success" role="status">
        <Clock size={30} />
        <h2>Online requests are opening soon.</h2>
        <p>We are setting up our request forms. Please check back shortly.</p>
      </div>
    );
  if (success)
    return (
      <div className="form-success" ref={status} tabIndex={-1} role="status">
        <CheckCircle2 size={30} />
        <h2>{success.mode === 'local' ? 'Test request saved locally.' : 'Request received.'}</h2>
        <p>
          {success.mode === 'local'
            ? 'This development request is saved on this computer. It has not been sent to K4 AV Group.'
            : 'Thank you for the details. Your inquiry is saved for review. This does not confirm equipment availability, pricing or a booking.'}
        </p>
        <p>
          Reference: <strong>{success.id.slice(0, 8).toUpperCase()}</strong>
        </p>
        <button
          className="button secondary"
          onClick={() => {
            setSuccess(null);
            started.current = Date.now();
            setToken('');
            setAttempt((a) => a + 1);
          }}
        >
          Start another inquiry
        </button>
      </div>
    );
  function field(name: string, label: string, type = 'text', required = false, full = false) {
    return (
      <label className={`field ${full ? 'full' : ''}`} key={name}>
        {label}
        {required ? ' *' : ''}
        <input
          name={name}
          type={type}
          required={required}
          maxLength={name === 'email' ? 254 : 200}
          autoComplete={
            name === 'name'
              ? 'name'
              : name === 'company'
                ? 'organization'
                : name === 'email'
                  ? 'email'
                  : name === 'phone'
                    ? 'tel'
                    : undefined
          }
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {errors[name] && (
          <span className="field-error" id={`${name}-error`}>
            {errors[name][0]}
          </span>
        )}
      </label>
    );
  }
  return (
    <form className={`form ${rental ? 'compact' : ''}`} onSubmit={submit} aria-label={`${kind} inquiry form`}>
      <div className="honey" aria-hidden="true">
        <label>
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {field('name', 'Full name', 'text', true)}
      {field('company', 'Company')}
      {field('email', 'Email', 'email', true)}
      {field('phone', 'Phone', 'tel', rental)}
      {kind === 'contact' && (
        <label className="field full">
          What is your message about? *
          <select name="topic" required defaultValue="" aria-invalid={Boolean(errors.topic)}>
            <option value="" disabled>
              Choose a topic
            </option>
            {contactTopics.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          {errors.topic && <span className="field-error">{errors.topic[0]}</span>}
        </label>
      )}
      {kind === 'quote' && division === 'integration' && (
        <>
          <input type="hidden" name="service" value="Commercial AV" />
          {field('location', 'Project location')}
          <label className="field">
            Project type
            <select name="projectType" defaultValue="">
              <option value="">Select a type</option>
              {projectTypes.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {field('timeline', 'Timeline')}
        </>
      )}
      {kind === 'quote' && division === 'events' && (
        <>
          <input
            type="hidden"
            name="service"
            value={defaultService === 'Equipment Rental' ? 'Equipment Rental' : 'Live Event'}
          />
          {field('timeline', 'Event date')}
          {field('location', 'Venue / location')}
          {field('attendance', 'Estimated attendance')}
          <label className="field">
            Event type
            <select name="eventType" defaultValue="">
              <option value="">Select a type</option>
              {eventTypeOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <fieldset className="field full needs">
            <legend>What do you need?</legend>
            {eventNeeds.map((x) => (
              <label key={x} className="check">
                <input type="checkbox" name="needs" value={x} />
                {x}
              </label>
            ))}
          </fieldset>
        </>
      )}
      {kind === 'quote' && !division && (
        <>
          <label className="field full">
            Service needed *
            <select
              name="service"
              required
              defaultValue={
                serviceOptions.includes(defaultService as (typeof serviceOptions)[number]) ? defaultService : ''
              }
              aria-invalid={Boolean(errors.service)}
            >
              <option value="" disabled>
                Select a service
              </option>
              {serviceOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            {errors.service && <span className="field-error">{errors.service[0]}</span>}
          </label>
          {field('location', 'Location')}
          {field('timeline', 'Project / event date')}
          <label className="field">
            Budget range (optional)
            <select name="budget" defaultValue="">
              <option value="">Select a range</option>
              {['Under $2,500', '$2,500–$10,000', '$10,000–$25,000', '$25,000+', 'To be discussed'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </>
      )}
      {rental && (
        <>
          <label className="field">
            Rental start date *
            <input
              name="startDate"
              type="date"
              required
              min={currentRentalDate()}
              aria-invalid={Boolean(errors.startDate)}
            />
            {errors.startDate && <span className="field-error">{errors.startDate[0]}</span>}
          </label>
          <label className="field">
            Rental end date *
            <input
              name="endDate"
              type="date"
              required
              min={currentRentalDate()}
              aria-invalid={Boolean(errors.endDate)}
            />
            {errors.endDate && <span className="field-error">{errors.endDate[0]}</span>}
          </label>
          <label className="field">
            Pickup / delivery *
            <select name="fulfillment" defaultValue="Pickup">
              <option>Pickup</option>
              <option>Delivery</option>
            </select>
          </label>
        </>
      )}
      {!quoteKind && (
        <label className="field">
          Preferred contact method
          <select name="preferredContact" defaultValue="Email">
            <option>Email</option>
            <option>Phone</option>
          </select>
        </label>
      )}
      <label className="field full">
        {rental ? 'Notes (optional)' : kind === 'quote' ? 'Project description *' : 'Your message *'}
        <textarea
          name="message"
          required={!rental}
          minLength={rental ? undefined : 15}
          maxLength={6000}
          defaultValue={context}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <span id="message-error" className="field-error">
            {errors.message[0]}
          </span>
        )}
      </label>

      {errors.items && (
        <p role="alert" className="field-error full">
          {errors.items[0]}
        </p>
      )}
      {error && (
        <div className="form-error full" role="alert">
          {error}
        </div>
      )}
      <Turnstile onToken={setToken} attempt={attempt} />
      <p className="form-note full">
        * Required. By submitting, you agree to be contacted about this inquiry. See our{' '}
        <Link className="text-link" href="/privacy">
          Privacy Policy
        </Link>
        . A request does not confirm a reservation.
      </p>
      <button type="submit" className="button full" disabled={busy || (rental && !items.length)}>
        {busy
          ? 'Saving request…'
          : rental
            ? 'Submit rental request'
            : kind === 'quote'
              ? division === 'integration'
                ? 'Request an AV Consultation'
                : division === 'events'
                  ? 'Plan an Event'
                  : 'Request a Quote'
              : kind === 'contact'
                ? 'Send message'
                : 'Send inquiry'}
        <ArrowUpRight size={17} />
      </button>
    </form>
  );
}
