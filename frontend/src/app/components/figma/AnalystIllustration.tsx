export default function AnalystIllustration({ className, width = 320, height = 200, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ruang data berisi brief, grafik, dan papan bukti"
      className={className}
      width={width}
      height={height}
      {...props}
    >
      <defs>
        <pattern id="analystGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" stroke="#20211D" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="250" rx="18" fill="#FFFCF7" />
      <rect width="400" height="250" rx="18" fill="url(#analystGrid)" />
      <rect x="34" y="30" width="332" height="190" rx="14" fill="#F1EAE0" stroke="#20211D" strokeOpacity="0.12" />
      <rect x="58" y="54" width="118" height="142" rx="10" fill="#171D1B" />
      <rect x="75" y="74" width="72" height="7" rx="3.5" fill="#D7B46A" />
      <rect x="75" y="94" width="52" height="7" rx="3.5" fill="#F7F3EC" opacity="0.48" />
      <rect x="75" y="110" width="78" height="7" rx="3.5" fill="#F7F3EC" opacity="0.32" />
      <rect x="75" y="142" width="18" height="32" rx="3" fill="#8F4D2F" />
      <rect x="102" y="126" width="18" height="48" rx="3" fill="#1F6F64" />
      <rect x="129" y="104" width="18" height="70" rx="3" fill="#D7B46A" />
      <rect x="206" y="56" width="126" height="74" rx="10" fill="#FFFCF7" stroke="#20211D" strokeOpacity="0.14" />
      <path d="M222 106C243 84 265 99 286 76C298 64 310 66 320 58" stroke="#1F6F64" strokeWidth="3" strokeLinecap="round" />
      <circle cx="222" cy="106" r="4" fill="#1F6F64" />
      <circle cx="286" cy="76" r="4" fill="#D7B46A" />
      <rect x="206" y="146" width="126" height="50" rx="10" fill="#FFFCF7" stroke="#20211D" strokeOpacity="0.14" />
      <rect x="222" y="162" width="46" height="7" rx="3.5" fill="#20211D" opacity="0.68" />
      <rect x="222" y="176" width="78" height="7" rx="3.5" fill="#20211D" opacity="0.24" />
      <path d="M176 126H206" stroke="#8F4D2F" strokeWidth="2" strokeDasharray="5 5" />
      <path d="M176 168H206" stroke="#1F6F64" strokeWidth="2" strokeDasharray="5 5" />
      <rect x="50" y="208" width="300" height="1" fill="#20211D" opacity="0.12" />
    </svg>
  );
}
