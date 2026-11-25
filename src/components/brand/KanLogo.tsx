import { useId } from "react";

export type KanLogoVariant = "primary" | "navy" | "black";

/**
 * Clean vector Kan wordmark matching Brand Guidelines v1.0.
 * Maintains at least 80px width on screen (K stem clear space).
 */
export function KanLogo({
  variant = "primary",
  className = "h-8 w-auto min-w-[80px]",
}: {
  variant?: KanLogoVariant;
  className?: string;
}) {
  const clipId = useId();

  const kFill =
    variant === "primary"
      ? "#42DFD1"
      : variant === "navy"
        ? "#070D35"
        : "#000000";

  const textFill =
    variant === "primary"
      ? "#FAFAFF"
      : variant === "navy"
        ? "#070D35"
        : "#000000";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 210 72"
      role="img"
      aria-label="Kan"
      className={className}
    >
      {variant === "primary" ? (
        <defs>
          <clipPath id={clipId}>
            <path d="M 34 31 L 47 31 L 77 64 Q 79 68 74 68 H 54 Q 50 68 47 65 L 24 41 Z" />
          </clipPath>
        </defs>
      ) : null}
      {/* K vertical stem */}
      <path
        d="M 8 8 Q 8 4 12 4 H 25 Q 29 4 29 8 V 64 Q 29 68 25 68 H 12 Q 8 68 8 64 Z"
        fill={kFill}
      />
      {/* K upper diagonal */}
      <path
        d="M 26 30 L 54 4 H 75 Q 78 4 75 8 L 45 36 L 26 36 Z"
        fill={kFill}
      />
      {/* K lower diagonal */}
      <path
        d="M 34 31 L 47 31 L 77 64 Q 79 68 74 68 H 54 Q 50 68 47 65 L 24 41 Z"
        fill={kFill}
      />
      {/* Guava endcap on primary variant */}
      {variant === "primary" ? (
        <rect
          x="44"
          y="60"
          width="40"
          height="10"
          fill="#FF806B"
          clipPath={`url(#${clipId})`}
        />
      ) : null}
      {/* Lowercase a */}
      <path
        fillRule="evenodd"
        d="M 106 20 A 24 24 0 1 0 116 66 V 64 Q 116 68 120 68 H 132 Q 136 68 136 64 V 25 Q 136 21 132 21 H 120 Q 116 21 116 25 V 22 A 24 24 0 0 0 106 20 Z M 106 34.5 A 9.5 9.5 0 1 1 106 53.5 A 9.5 9.5 0 1 1 106 34.5 Z"
        fill={textFill}
      />
      {/* Lowercase n */}
      <path
        d="M 144 64 V 25 Q 144 21 148 21 H 159 Q 162 21 163 24 C 167 20 172 19 178 19 C 194 19 202 29 202 44 V 64 Q 202 68 198 68 H 186 Q 182 68 182 64 V 45 C 182 39 178 36 172 36 C 166 36 164 40 164 46 V 64 Q 164 68 160 68 H 148 Q 144 68 144 64 Z"
        fill={textFill}
      />
    </svg>
  );
}
