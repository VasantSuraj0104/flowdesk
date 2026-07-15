// Factors brand mark. Inlined rather than loaded from /public so it ships with
// the component, needs no network request, and can't 404.
// Brand red is fixed — this is a logo, not a themeable icon.

export const FACTORS_RED = "#FC3B2D";

export function FactorsLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      height={size}
      viewBox="0 0 147 249"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Factors"
    >
      <path
        d="M65.2559 182.493C61.8675 212.884 37.7431 237.022 7.3584 240.413V182.493H65.2559Z"
        fill={FACTORS_RED}
        stroke={FACTORS_RED}
        strokeWidth="14.7168"
      />
      <path
        d="M138.323 94.9341C134.665 127.748 106.835 153.262 73.0449 153.262H7.3584V94.9341H138.323Z"
        fill={FACTORS_RED}
        stroke={FACTORS_RED}
        strokeWidth="14.7168"
      />
      <path
        d="M73.0449 7.3584H138.323C134.665 40.1724 106.835 65.6865 73.0449 65.6865H7.7666C11.4244 32.8726 39.2549 7.3584 73.0449 7.3584Z"
        fill={FACTORS_RED}
        stroke={FACTORS_RED}
        strokeWidth="14.7168"
      />
    </svg>
  );
}
