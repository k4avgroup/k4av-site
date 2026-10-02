import Link from 'next/link';
import {
  DivisionHero,
  QuickFacts,
  TileGrid,
  GroupCards,
  Split,
  WidePhoto,
  DetailTrio,
  Chips,
  ExperienceCards,
  DivisionCTA,
} from '@/components/division';
import { Button, SectionHeading } from '@/components/ui';
import { HowItWorks } from '@/components/how-it-works';
import { Shot } from '@/components/photos';
import { photos } from '@/data/photos';
import { spaces, serviceGroups, platformList, integrationExperience, divisions } from '@/data/division';
import { experienceYears, experienceOrgs } from '@/data/site';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'AV Integration and Commissioning in Seattle',
  'Commercial AV integration, commissioning, DSP and control programming, testing and technical support for offices, boardrooms and training spaces in Seattle and Bellevue.',
  '/integration',
);

export default function Integration() {
  return (
    <>
      <DivisionHero
        eyebrow="Commercial AV integration"
        lead="AV Systems."
        accent="Engineered to Work."
        text="Commercial AV integration, commissioning, programming, system configuration, testing and technical support across the Seattle area."
        primary={{ href: divisions.integration.quote, label: 'Discuss a Project' }}
        secondary={{ href: '#solutions', label: 'Explore Capabilities' }}
        photo={photos.roomGrand}
      />
      <QuickFacts
        items={[
          { title: 'Commissioning', note: 'Verified, documented systems' },
          { title: 'Programming', note: 'DSP and control' },
          { title: 'Networked AV', note: 'Dante, AES67, AV over IP' },
          { title: 'Support', note: 'Testing and troubleshooting' },
        ]}
      />

      <section className="section container" id="who-we-are">
        <div className="intro-split">
          <div>
            <span className="eyebrow">Who we are</span>
            <h2>A founder-led AV engineering company.</h2>
          </div>
          <div>
            <p className="lead">
              K4 AV Group is built on {experienceYears} years of hands-on audio and AV work: commissioning, programming,
              troubleshooting and real-world live production.
            </p>
            <p>
              We understand how the whole system works, so rooms are handed over tested, documented and easy to use.
            </p>
            <Link className="text-link" href="/about">
              About the founder
            </Link>
          </div>
        </div>
      </section>

      <TileGrid
        id="solutions"
        eyebrow="Solutions"
        title="Spaces we support"
        text="From huddle rooms to large presentation spaces, we make AV systems reliable and easy to use."
        tiles={spaces}
      />

      <GroupCards
        eyebrow="Services"
        title="What we do"
        text="Capabilities across integration, audio, control and support."
        groups={serviceGroups}
      />

      <HowItWorks division="integration" id="commissioning" />

      <DetailTrio
        items={[
          { photo: photos.roomControl, label: 'Room control and cabling' },
          { photo: photos.roomLectern, label: 'Lectern and presentation systems' },
          { photo: photos.roomPresent, label: 'Large presentation rooms' },
        ]}
      />

      <Split eyebrow="Engineering details" title="Clean racks. Reliable systems." photo={photos.rackQsys}>
        <p>Professional rack integration, cable management and system configuration built for long-term reliability.</p>
        <Button href="#platforms" secondary>
          Technologies we use
        </Button>
      </Split>

      <WidePhoto photo={photos.roomEventRoom} />

      <DetailTrio
        items={[
          { photo: photos.rackCables, label: 'Network and cable management' },
          { photo: photos.racksBlue, label: 'System build and patching' },
          { photo: photos.softwareTable, label: 'Configuration and commissioning software' },
        ]}
      />

      <section className="section container" id="platforms">
        <SectionHeading
          eyebrow="Technologies"
          title="Platforms we have worked with."
          text="Professional experience with these systems. K4 AV Group is not an authorized dealer unless stated."
        />
        <Chips items={platformList} />
      </section>

      <ExperienceCards
        id="experience"
        title="Experience behind the work."
        items={integrationExperience}
        note={
          <>
            Experience supporting enterprise AV environments, including projects for organizations such as{' '}
            {experienceOrgs.join(', ')} and public universities. This experience was gained in previous professional
            roles and does not describe K4 AV Group client projects.
          </>
        }
      />

      <section className="section container">
        <div className="split">
          <div className="split-text">
            <span className="eyebrow">About</span>
            <h2>Hands-on experience, one accountable person.</h2>
            <p>
              The founder started in music and recording, moved into live sound and corporate production, then into
              commercial AV and commissioning. K4 AV Group is the result.
            </p>
            <Button href="/about" secondary>
              Read more
            </Button>
          </div>
          <Shot photo={photos.founderOnSite} sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
      </section>

      <DivisionCTA
        title="Have a system to build or fix?"
        text="Tell us about the project and we’ll help determine the right technical approach."
        action={{ href: divisions.integration.quote, label: 'Request an AV Consultation' }}
      />
    </>
  );
}
