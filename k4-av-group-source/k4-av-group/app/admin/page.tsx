import { notFound } from 'next/navigation';
// Fail closed. Replace only after Supabase Auth and server-side role enforcement exist.
export default function Admin() { notFound(); }
