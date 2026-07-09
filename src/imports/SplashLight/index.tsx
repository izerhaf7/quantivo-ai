import svgPaths from "./svg-bkulb7jz9w";

function CLogo() {
  return (
    <div className="absolute h-[116.14px] left-[147px] top-[389px] w-[111px]" data-name="C-Logo">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 111 116.14">
        <g id="C-Logo">
          <path d={svgPaths.pb1b5600} fill="url(#paint0_linear_1_54)" id="Subtract" />
          <ellipse cx="58.0834" cy="58.0567" fill="url(#paint1_linear_1_54)" id="Ellipse 17" rx="9.82936" ry="9.82938" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_54" x1="55.5" x2="55.5" y1="4.29538e-08" y2="116.14">
            <stop stopColor="#2A74C4" />
            <stop offset="1" stopColor="#14385E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_54" x1="58.0834" x2="58.0834" y1="48.2273" y2="67.886">
            <stop stopColor="#2A74C4" />
            <stop offset="1" stopColor="#14385E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute contents left-[147px] top-[389px]" data-name="Logo">
      <CLogo />
    </div>
  );
}

export default function SplashLight() {
  return (
    <div className="bg-[#f7f8fa] overflow-clip relative rounded-[18px] size-full" data-name="Splash-Light">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:Light',sans-serif] leading-[0] left-[calc(50%-0.5px)] not-italic text-[#474343] text-[0px] text-center top-[833px] tracking-[-0.28px] whitespace-nowrap">
        <span className="leading-[24px] text-[16px]">Version</span>
        <span className="leading-[24px] text-[14px]">{` 1.0`}</span>
      </p>
      <div className="absolute h-[26px] left-[157px] top-[801px] w-[126px]" data-name="onsultin">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 126 26">
          <g id="onsultin">
            <path d={svgPaths.p1deb6480} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2b6b900} fill="var(--fill-0, black)" />
            <path d={svgPaths.p18e63a40} fill="var(--fill-0, black)" />
            <path d={svgPaths.p3dc96448} fill="var(--fill-0, black)" />
            <path d={svgPaths.p70de580} fill="var(--fill-0, black)" />
            <path d={svgPaths.p24710f00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p393dd400} fill="var(--fill-0, black)" />
            <path d={svgPaths.p5e59df0} fill="var(--fill-0, black)" />
            <path d={svgPaths.p20311980} fill="var(--fill-0, black)" />
          </g>
        </svg>
      </div>
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Plus_Jakarta_Sans:SemiBold',sans-serif] font-semibold leading-[24px] left-[calc(50%-63px)] text-[35px] text-black text-center top-[801px] tracking-[-0.7px] whitespace-nowrap">C</p>
      <Logo />
    </div>
  );
}