/**
 * ScaleDiagram — a 5-fret scale-box placeholder.
 *
 * Iteration 1 intentionally renders a minimal box. Per the spec, the AI
 * provides only `{ name, rootFret }`; mapping to actual degrees is out of
 * scope for this iteration (see docs/ROADMAP.md).
 */

const NUM_STRINGS = 6;
const NUM_FRETS = 5;
const WIDTH = 240;
const HEIGHT = 120;
const PAD_X = 28;
const PAD_Y_TOP = 20;
const PAD_Y_BOTTOM = 12;

interface Props {
  rootFret: number;
  scaleName: string;
}

export function ScaleDiagram({ rootFret, scaleName }: Props): JSX.Element {
  const stringGap = (HEIGHT - PAD_Y_TOP - PAD_Y_BOTTOM) / (NUM_STRINGS - 1);
  const fretGap = (WIDTH - PAD_X * 2) / NUM_FRETS;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="bg-neutral-950 rounded border border-neutral-800"
      >
        {/* Strings (horizontal) */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => (
          <line
            key={`s${i}`}
            x1={PAD_X}
            y1={PAD_Y_TOP + i * stringGap}
            x2={WIDTH - PAD_X}
            y2={PAD_Y_TOP + i * stringGap}
            stroke="#525252"
            strokeWidth="1"
          />
        ))}
        {/* Frets (vertical) */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, i) => (
          <line
            key={`f${i}`}
            x1={PAD_X + i * fretGap}
            y1={PAD_Y_TOP}
            x2={PAD_X + i * fretGap}
            y2={HEIGHT - PAD_Y_BOTTOM}
            stroke="#525252"
            strokeWidth="1"
          />
        ))}
        {/* Fret numbers */}
        {Array.from({ length: NUM_FRETS }, (_, i) => (
          <text
            key={`fn${i}`}
            x={PAD_X + i * fretGap + fretGap / 2}
            y={HEIGHT - 2}
            fill="#a3a3a3"
            fontSize="8"
            textAnchor="middle"
          >
            {rootFret + i}
          </text>
        ))}
        {/* Root-fret marker */}
        <text
          x={PAD_X - 4}
          y={PAD_Y_TOP + stringGap * 2.5}
          fill="#818cf8"
          fontSize="9"
          textAnchor="end"
        >
          {rootFret}fr
        </text>
      </svg>
      <p className="text-neutral-500">
        {scaleName} — {rootFret}–{rootFret + NUM_FRETS} fret range.
      </p>
    </div>
  );
}
