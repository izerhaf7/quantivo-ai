import svgPaths from "./svg-v3empm6kff";

function CLogo() {
  return (
    <div className="absolute h-[116.141px] left-[146px] top-[161px] w-[110.999px]" data-name="C-Logo">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 111 116.14">
        <g id="C-Logo">
          <path d={svgPaths.p1bcfc000} fill="url(#paint0_linear_1_271)" id="Subtract" />
          <ellipse cx="58.0825" cy="58.0562" fill="url(#paint1_linear_1_271)" id="Ellipse 17" rx="9.82936" ry="9.82938" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_271" x1="55.5" x2="55.5" y1="-2.50293e-09" y2="116.14">
            <stop stopColor="#2A74C4" />
            <stop offset="1" stopColor="#14385E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_271" x1="58.0825" x2="58.0825" y1="48.2269" y2="67.8856">
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
    <div className="absolute contents left-[146px] top-[161px]" data-name="Logo">
      <CLogo />
    </div>
  );
}

function TypeButtonType2PrimaryType3RoundedStyleDefaultStateActiveThemeDefaultComponentButton() {
  return (
    <div className="bg-[#141718] content-stretch drop-shadow-[4px_8px_12px_rgba(23,206,146,0.25)] flex items-center justify-center px-[15.273px] py-[17.182px] relative rounded-[95.455px] shrink-0 w-[364.636px]" data-name="Type=Button, Type 2=Primary, Type 3=Rounded, Style=Default, State=Active, Theme=Default, Component=Button">
      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Urbanist:Bold',sans-serif] font-bold justify-center leading-[0] min-w-px relative text-[18px] text-center text-white tracking-[0.2px]">
        <p className="leading-[1.6]">Log in</p>
      </div>
    </div>
  );
}

function TypeButtonType2SecondaryType3RoundedStyleDefaultStateActiveThemeLightComponentButton() {
  return (
    <div className="bg-[#e3e3e3] content-stretch flex items-center justify-center px-[15.273px] py-[17.182px] relative rounded-[95.455px] shrink-0 w-[364.636px]" data-name="Type=Button, Type 2=Secondary, Type 3=Rounded, Style=Default, State=Active, Theme=Light, Component=Button">
      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Urbanist:Bold',sans-serif] font-bold justify-center leading-[0] min-w-px relative text-[#b1b1b1] text-[17.182px] text-center tracking-[0.1909px]">
        <p className="leading-[1.6]">Sign up</p>
      </div>
    </div>
  );
}

function AutoLayoutVertical() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[22.909px] items-start left-[25px] top-[542px] w-[364.636px]" data-name="Auto Layout Vertical">
      <TypeButtonType2PrimaryType3RoundedStyleDefaultStateActiveThemeDefaultComponentButton />
      <TypeButtonType2SecondaryType3RoundedStyleDefaultStateActiveThemeLightComponentButton />
    </div>
  );
}

function FacebookButton() {
  return (
    <div className="absolute contents left-[213px] top-[779px]" data-name="Facebook Button">
      <div className="absolute bg-[rgba(66,103,178,0.25)] h-[57px] left-[213px] rounded-[10px] top-[779px] w-[165px]" />
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:SemiBold',sans-serif] leading-[normal] left-[295px] not-italic text-[#4267b2] text-[14px] text-center top-[797px] tracking-[2.55px] uppercase whitespace-nowrap">facebook</p>
    </div>
  );
}

function GoogleButton() {
  return (
    <div className="absolute contents left-[34px] top-[779px]" data-name="Google Button">
      <div className="absolute bg-[rgba(212,70,56,0.25)] h-[57px] left-[34px] rounded-[10px] top-[779px] w-[165px]" />
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:SemiBold',sans-serif] leading-[normal] left-[116.5px] not-italic text-[#d44638] text-[14px] text-center top-[797px] tracking-[2.55px] uppercase whitespace-nowrap">Google</p>
    </div>
  );
}

function Accounts() {
  return (
    <div className="absolute contents left-[34px] top-[779px]" data-name="Accounts">
      <FacebookButton />
      <GoogleButton />
    </div>
  );
}

function SocialMedia() {
  return (
    <div className="absolute contents left-[34px] top-[732px]" data-name="Social Media">
      <Accounts />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[110px] not-italic text-[#acadb9] text-[16px] top-[calc(50%+284px)] tracking-[-0.16px] whitespace-nowrap">Continue With Accounts</p>
    </div>
  );
}

export default function Welcome() {
  return (
    <div className="bg-[#f7f8fa] overflow-clip relative rounded-[18px] size-full" data-name="Welcome">
      <Logo />
      <div className="-translate-x-1/2 -translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Urbanist:Bold',sans-serif] font-bold justify-center leading-[0] left-[209px] text-[#212121] text-[0px] text-center top-[415px] w-[382px] whitespace-pre-wrap">
        <p className="font-['Plus_Jakarta_Sans:Bold',sans-serif] leading-[1.6] mb-0 text-[40px]">{` Welcome to `}</p>
        <p className="font-['Plus_Jakarta_Sans:Bold',sans-serif] text-[40px]">
          <span className="leading-[1.6] text-[#141718]">C</span>
          <span className="leading-[1.6] text-[rgba(20,23,24,0)]">onsultin</span>
        </p>
      </div>
      <div className="absolute h-[27px] left-[148px] top-[436px] w-[132px]" data-name="onsultin">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 132 27">
          <g id="onsultin">
            <path d={svgPaths.p1650e000} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1d6fd880} fill="var(--fill-0, black)" />
            <path d={svgPaths.p5f3d80} fill="var(--fill-0, black)" />
            <path d={svgPaths.p3afa1340} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1c525400} fill="var(--fill-0, black)" />
            <path d={svgPaths.p39c28000} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2571cf00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p3954300} fill="var(--fill-0, black)" />
            <path d={svgPaths.p13c58300} fill="var(--fill-0, black)" />
          </g>
        </svg>
      </div>
      <AutoLayoutVertical />
      <SocialMedia />
    </div>
  );
}