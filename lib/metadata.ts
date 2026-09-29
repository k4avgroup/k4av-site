import type { Metadata } from 'next';
export function pageMetadata(title: string, description: string, path: string): Metadata { return { title, description, alternates: { canonical: path }, openGraph: { title: `${title} | K4 AV Group`, description, url: path, type: 'website' } }; }
