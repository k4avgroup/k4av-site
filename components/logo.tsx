import Image from 'next/image';
import Link from 'next/link';

// The header and footer are always dark, so the white version of the logo is used on both.
export function Logo() {
  return (
    <Link href="/" aria-label="K4 AV Group home" className="logo">
      <Image
        src="/images/logo/k4av-logo-final.png"
        alt="K4 AV Group"
        width={1400}
        height={447}
        priority
        sizes="(max-width: 800px) 100px, 150px"
        className="logo-img"
      />
    </Link>
  );
}
