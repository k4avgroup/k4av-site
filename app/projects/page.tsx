import { PageIntro, CTA } from '@/components/ui';
import { ProjectCard } from '@/components/sections';
import { contentRepository } from '@/services/content';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('Projects', 'Explore illustrative AV commissioning, meeting-space and live-production project profiles.', '/projects');
export default function Projects() { return <><PageIntro eyebrow="Project perspectives" title="Behind every experience, a working system." text="A closer look at the kinds of technical challenges we support."/><section className="container page-content"><div className="notice">These are sample project profiles, not completed client engagements. Owner-approved case studies and project photography will replace them.</div><div className="project-grid">{contentRepository.projects().map(p => <ProjectCard project={p} key={p.slug}/>)}</div></section><CTA /></>; }
