import type { Metadata } from 'next';
import { Hero } from '@/components/hero';
import { CertificationStrip, ServicesSection, IndustriesSection, ProcessTimeline, ProjectsSection, ExperienceSection, RentalTeaser } from '@/components/sections';
import { CTA } from '@/components/ui';
export const metadata: Metadata = { alternates: { canonical: '/' } };
export default function Home() { return <><Hero /><CertificationStrip /><ServicesSection /><IndustriesSection /><ProcessTimeline /><ProjectsSection /><ExperienceSection /><RentalTeaser /><CTA /></>; }
