import QRCode from "qrcode";

/*
 * A QR code drawn as one inline SVG: data modules as softly rounded squares,
 * the three finder "eyes" as rounded frames. Scanners read it like any other
 * code; people see something that belongs on an invitation.
 */
export function QrCode({
  value,
  className = "",
  label = "קוד QR",
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const code = QRCode.create(value, { errorCorrectionLevel: "M" });
  const size = code.modules.size;
  const data = code.modules.data;
  const quiet = 2;
  const total = size + quiet * 2;
  const isEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
  let dots = "";
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!data[r * size + c] || isEye(r, c)) continue;
      const x = c + quiet + 0.08;
      const y = r + quiet + 0.08;
      dots += `M${x + 0.28},${y}h0.28a0.28,0.28 0 0 1 0.28,0.28v0.28a0.28,0.28 0 0 1 -0.28,0.28h-0.28a0.28,0.28 0 0 1 -0.28,-0.28v-0.28a0.28,0.28 0 0 1 0.28,-0.28z`;
    }
  const eyes = [
    [quiet, quiet],
    [quiet, size - 7 + quiet],
    [size - 7 + quiet, quiet],
  ];
  return (
    <svg
      className={className}
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label={label}
      shapeRendering="geometricPrecision"
    >
      <rect width={total} height={total} fill="#fff" />
      <path d={dots} fill="currentColor" />
      {eyes.map(([y, x]) => (
        <g key={`${x}-${y}`} fill="currentColor">
          <path
            fillRule="evenodd"
            d={`M${x + 1.6},${y}h3.8a1.6,1.6 0 0 1 1.6,1.6v3.8a1.6,1.6 0 0 1 -1.6,1.6h-3.8a1.6,1.6 0 0 1 -1.6,-1.6v-3.8a1.6,1.6 0 0 1 1.6,-1.6z M${x + 1.5},${y + 1}h4a0.5,0.5 0 0 1 0.5,0.5v4a0.5,0.5 0 0 1 -0.5,0.5h-4a0.5,0.5 0 0 1 -0.5,-0.5v-4a0.5,0.5 0 0 1 0.5,-0.5z`}
          />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} />
        </g>
      ))}
    </svg>
  );
}
