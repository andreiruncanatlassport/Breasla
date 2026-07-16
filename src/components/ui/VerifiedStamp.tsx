import { clsx } from "clsx";

interface VerifiedStampProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: 56, font: 6.2, ring: 2 },
  md: { box: 84, font: 8.5, ring: 2.5 },
  lg: { box: 132, font: 12, ring: 3 },
};

/**
 * Elementul de semnatura vizuala al platformei: o "stampila" rotativa,
 * folosita langa firmele verificate prin ANAF. Se foloseste cu masura —
 * pe hero si pe cardurile de firma verificata, nu decorativ peste tot.
 */
export function VerifiedStamp({
  label = "VERIFICAT ANAF",
  size = "md",
  className,
}: VerifiedStampProps) {
  const s = sizeMap[size];
  const radius = s.box / 2 - s.ring * 2;

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center -rotate-6 select-none",
        className
      )}
      style={{ width: s.box, height: s.box }}
      aria-label={label}
      role="img"
    >
      <svg
        viewBox={`0 0 ${s.box} ${s.box}`}
        width={s.box}
        height={s.box}
        className="text-seal"
      >
        <circle
          cx={s.box / 2}
          cy={s.box / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.ring}
        />
        <circle
          cx={s.box / 2}
          cy={s.box / 2}
          r={radius - s.ring * 2.2}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.ring * 0.6}
          strokeDasharray="2 3"
          opacity={0.6}
        />
        <path
          id="stampCircle"
          d={`M ${s.box / 2}, ${s.box / 2} m -${radius - s.ring * 4}, 0 a ${radius - s.ring * 4},${radius - s.ring * 4} 0 1,1 ${(radius - s.ring * 4) * 2},0 a ${radius - s.ring * 4},${radius - s.ring * 4} 0 1,1 -${(radius - s.ring * 4) * 2},0`}
          fill="none"
        />
        <text fontSize={s.font} fontWeight={700} letterSpacing="1.5" fill="currentColor">
          <textPath href="#stampCircle" startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
        <path
          d={`M ${s.box * 0.32} ${s.box * 0.52} l ${s.box * 0.12} ${s.box * 0.12} l ${s.box * 0.22} ${-s.box * 0.24}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.ring * 1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
