import { FOUNDER_BRANDING } from '../lib/founderBranding';

type FounderLogoProps = {
  size?: number;
};

export default function FounderLogo({ size = 32 }: FounderLogoProps) {
  return (
    <img
      src={FOUNDER_BRANDING.logoUrl}
      alt={`${FOUNDER_BRANDING.companyName} logo`}
      width={size}
      height={size}
      className="shrink-0 rounded-xl object-cover"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 0 24px rgba(43, 230, 129, 0.18)',
      }}
    />
  );
}
