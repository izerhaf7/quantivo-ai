export default function MultiAgentFlow({ className, width = 400, height = 200, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 500 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Alur kerja agen dari brief ke rekomendasi"
      className={className}
      width={width}
      height={height}
      {...props}
    >
      <rect width="500" height="250" rx="18" fill="#FFFCF7" />
      <rect x="30" y="34" width="440" height="182" rx="16" fill="#F1EAE0" stroke="#20211D" strokeOpacity="0.12" />
      {[
        [58, "INPUT", "Ide mentah", "#8F4D2F"],
        [166, "BRIEF", "Konteks", "#1F6F64"],
        [274, "BUKTI", "Sumber", "#D7B46A"],
        [382, "AKSI", "Prioritas", "#171D1B"],
      ].map(([x, title, subtitle, color]) => (
        <g key={title as string}>
          <rect x={x as number} y="92" width="72" height="66" rx="13" fill="#FFFCF7" stroke="#20211D" strokeOpacity="0.14" />
          <rect x={(x as number) + 14} y="72" width="44" height="8" rx="4" fill={color as string} opacity="0.85" />
          <circle cx={(x as number) + 36} cy="108" r="8" fill={color as string} opacity="0.18" />
          <text x={(x as number) + 36} y="132" textAnchor="middle" fontSize="10" fontFamily="monospace" fill={color as string} fontWeight="700">{title as string}</text>
          <text x={(x as number) + 36} y="146" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#62594D">{subtitle as string}</text>
        </g>
      ))}
      <path d="M130 125H162" stroke="#8F4D2F" strokeWidth="2" strokeLinecap="round" />
      <path d="M238 125H270" stroke="#1F6F64" strokeWidth="2" strokeLinecap="round" />
      <path d="M346 125H378" stroke="#D7B46A" strokeWidth="2" strokeLinecap="round" />
      <path d="M202 158V188H146" stroke="#1F6F64" strokeWidth="2" strokeDasharray="5 5" />
      <path d="M310 158V188H364" stroke="#8F4D2F" strokeWidth="2" strokeDasharray="5 5" />
      <rect x="110" y="184" width="72" height="22" rx="8" fill="#1F6F64" opacity="0.14" />
      <text x="146" y="199" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#1F6F64" fontWeight="700">Web · Sosial</text>
      <rect x="328" y="184" width="72" height="22" rx="8" fill="#8F4D2F" opacity="0.14" />
      <text x="364" y="199" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#8F4D2F" fontWeight="700">Risk · Data</text>
    </svg>
  );
}
