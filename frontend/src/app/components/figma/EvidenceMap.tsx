export default function EvidenceMap({ className, width = 400, height = 200, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 500 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Peta bukti dan tingkat keyakinan sumber"
      className={className}
      width={width}
      height={height}
      {...props}
    >
      <rect width="500" height="250" rx="18" fill="#FFFCF7" />
      <rect x="30" y="28" width="440" height="194" rx="16" fill="#F1EAE0" stroke="#20211D" strokeOpacity="0.12" />
      <path d="M122 126C182 64 285 58 360 94" stroke="#1F6F64" strokeWidth="2" strokeDasharray="7 6" opacity="0.62" />
      <path d="M122 126C188 186 287 196 382 158" stroke="#8F4D2F" strokeWidth="2" strokeDasharray="7 6" opacity="0.52" />
      <path d="M360 94C392 112 398 132 382 158" stroke="#D7B46A" strokeWidth="2" strokeDasharray="7 6" opacity="0.72" />
      <g>
        <rect x="58" y="82" width="132" height="92" rx="13" fill="#171D1B" />
        <rect x="76" y="104" width="64" height="7" rx="3.5" fill="#D7B46A" />
        <rect x="76" y="120" width="92" height="6" rx="3" fill="#F7F3EC" opacity="0.45" />
        <rect x="76" y="134" width="72" height="6" rx="3" fill="#F7F3EC" opacity="0.3" />
        <rect x="76" y="150" width="54" height="16" rx="8" fill="#1F6F64" />
        <text x="103" y="161" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#F4FFF9" fontWeight="700">KUAT</text>
      </g>
      <g>
        <rect x="304" y="58" width="116" height="72" rx="13" fill="#FFFCF7" stroke="#20211D" strokeOpacity="0.14" />
        <path d="M340 90L354 104L384 76" stroke="#1F6F64" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="362" y="118" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#1F6F64" fontWeight="700">87%</text>
      </g>
      <g>
        <rect x="320" y="146" width="112" height="46" rx="12" fill="#FFFCF7" stroke="#20211D" strokeOpacity="0.14" />
        <circle cx="344" cy="169" r="10" fill="#8F4D2F" opacity="0.18" />
        <rect x="362" y="159" width="48" height="6" rx="3" fill="#20211D" opacity="0.58" />
        <rect x="362" y="173" width="34" height="5" rx="2.5" fill="#20211D" opacity="0.26" />
      </g>
      <rect x="226" y="164" width="72" height="30" rx="10" fill="#D7B46A" opacity="0.22" />
      <text x="262" y="183" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#8F4D2F" fontWeight="700">TERUJI</text>
      <rect x="220" y="54" width="72" height="30" rx="10" fill="#1F6F64" opacity="0.16" />
      <text x="256" y="73" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#1F6F64" fontWeight="700">SUMBER</text>
    </svg>
  );
}
