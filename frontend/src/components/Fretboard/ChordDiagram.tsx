import type { Chord } from '../../types/masterclass';

/**
 * ChordDiagram — renders a standard 6-string chord box from a "frets" string.
 *
 * Input format (low E to high E): 6 characters, one per string.
 *   - digit (0-9) = fretted at that fret (0 = open)
 *   - 'x' / 'X'  = muted
 *
 * Example: "x02210" = A minor.
 *
 * This is a simple SVG diagram — good enough for iteration 1; can be
 * replaced with a richer renderer later without changing the call sites.
 */

const NUM_STRINGS = 6;
const NUM_FRETS = 5;
const WIDTH = 80;
const HEIGHT = 100;
const PAD_X = 12;
const PAD_Y_TOP = 18;
const PAD_Y_BOTTOM = 8;

export function ChordDiagram({ chord }: { chord: Chord }): JSX.Element {
  const frets = normaliseFrets(chord.frets);
  const fretNumbers = frets.map((f) => (f === 'x' ? -1 : parseInt(f, 10)));
  const positiveFrets = fretNumbers.filter((f) => f > 0);
  const minFret = positiveFrets.length ? Math.min(...positiveFrets) : 1;
  const displayBaseFret = minFret > 1 ? minFret : 1;
  const showBaseLabel = displayBaseFret > 1;

  const stringGap = (WIDTH - PAD_X * 2) / (NUM_STRINGS - 1);
  const fretGap = (HEIGHT - PAD_Y_TOP - PAD_Y_BOTTOM) / NUM_FRETS;

  return (
    <div className="flex flex-col items-center text-xs">
      <div className="font-medium mb-1 text-neutral-100">{chord.name}</div>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="bg-neutral-950 rounded border border-neutral-800"
      >
        {/* Strings (vertical lines) */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => (
          <line
            key={`s${i}`}
            x1={PAD_X + i * stringGap}
            y1={PAD_Y_TOP}
            x2={PAD_X + i * stringGap}
            y2={HEIGHT - PAD_Y_BOTTOM}
            stroke="#525252"
            strokeWidth="1"
          />
        ))}
        {/* Frets (horizontal lines) */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, i) => (
          <line
            key={`f${i}`}
            x1={PAD_X}
            y1={PAD_Y_TOP + i * fretGap}
            x2={WIDTH - PAD_X}
            y2={PAD_Y_TOP + i * fretGap}
            stroke={i === 0 && !showBaseLabel ? '#e5e5e5' : '#525252'}
            strokeWidth={i === 0 && !showBaseLabel ? 2 : 1}
          />
        ))}
        {/* Base-fret label (for non-open voicings) */}
        {showBaseLabel ? (
          <text
            x={PAD_X - 4}
            y={PAD_Y_TOP + fretGap * 0.6}
            fill="#a3a3a3"
            fontSize="8"
            textAnchor="end"
          >
            {displayBaseFret}fr
          </text>
        ) : null}
        {/* Dots / opens / mutes */}
        {fretNumbers.map((f, i) => {
          const cx = PAD_X + i * stringGap;
          if (f === -1) {
            return (
              <text
                key={`m${i}`}
                x={cx}
                y={PAD_Y_TOP - 6}
                fill="#a3a3a3"
                fontSize="9"
                textAnchor="middle"
              >
                x
              </text>
            );
          }
          if (f === 0) {
            return (
              <circle
                key={`o${i}`}
                cx={cx}
                cy={PAD_Y_TOP - 6}
                r="3"
                fill="none"
                stroke="#a3a3a3"
                strokeWidth="1"
              />
            );
          }
          const fretIndex = showBaseLabel ? f - displayBaseFret + 1 : f;
          const cy =
            PAD_Y_TOP + fretIndex * fretGap - fretGap / 2;
          return (
            <circle
              key={`d${i}`}
              cx={cx}
              cy={cy}
              r="4"
              fill="#818cf8"
            />
          );
        })}
      </svg>
    </div>
  );
}

function normaliseFrets(raw: string): string[] {
  const cleaned = raw.replace(/\s+/g, '').toLowerCase();
  const chars = cleaned.split('');
  if (chars.length !== NUM_STRINGS) {
    // Fallback: pad or truncate to 6. Invalid, but we don't crash.
    while (chars.length < NUM_STRINGS) chars.push('x');
    chars.length = NUM_STRINGS;
  }
  return chars;
}
