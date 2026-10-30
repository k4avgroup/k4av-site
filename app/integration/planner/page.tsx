import './planner.css';
import { PlannerLoader } from '@/components/planner/planner-loader';
import { PageIntro } from '@/components/ui';
import { pageMetadata } from '@/lib/metadata';

// A pilot: it is not linked from the site and stays out of search results until the owner decides otherwise.
export const metadata = {
  ...pageMetadata(
    'Meeting Room Planner',
    'Plan a meeting room in 3D: table, display, speakers, microphones and cameras, with an equipment list.',
    '/integration/planner',
  ),
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageIntro
        eyebrow="AV Integration · Pilot"
        title="Plan a meeting room in 3D."
        text="Describe the room, place the table, choose the display, sound and cameras, and see the result. A sketch to start the conversation."
      />
      <section className="container planner-wrap">
        <PlannerLoader />
      </section>
    </>
  );
}
