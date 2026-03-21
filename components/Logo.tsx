import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  height?: number;
  href?: string;
  className?: string;
  variant?: 'default' | 'white';
}

export default function Logo({ height = 36, href = '/', className = '', variant = 'default' }: LogoProps) {
  const img = (
    <Image
      src="/logo-precivox.svg"
      alt="PRECIVOX"
      width={Math.round(height * (606.97 / 570.59))}
      height={height}
      className={className}
      style={variant === 'white' ? { filter: 'brightness(0) invert(1)' } : undefined}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} aria-label="PRECIVOX - Início" style={{ display: 'inline-flex', alignItems: 'center' }}>
        {img}
      </Link>
    );
  }

  return img;
}
