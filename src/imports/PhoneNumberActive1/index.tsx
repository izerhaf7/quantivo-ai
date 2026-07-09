import svgPaths from "./svg-7svwa21igp";

function Later() {
  return (
    <div className="absolute contents left-[35px] top-[484px]" data-name="Later">
      <div className="absolute bg-[#e3e3e3] inset-[54.02%_8.45%_38.67%_8.45%] rounded-[14px]" />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[187px] not-italic text-[#b1b1b1] text-[16px] top-[505.29px] whitespace-nowrap">Later</p>
    </div>
  );
}

function VerificationButton() {
  return (
    <div className="absolute contents left-[35px] top-[405px]" data-name="Verification Button">
      <div className="absolute bg-[#141718] inset-[45.2%_8.45%_47.49%_8.45%] rounded-[14px]" />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[160.5px] not-italic text-[#f3f5f6] text-[16px] top-[426.29px] whitespace-nowrap">Verification</p>
    </div>
  );
}

function Buttons() {
  return (
    <div className="absolute contents left-[35px] top-[405px]" data-name="Buttons">
      <Later />
      <VerificationButton />
    </div>
  );
}

function Phone() {
  return (
    <div className="absolute inset-[37.03%_80.86%_60.91%_14.67%]" data-name="Phone">
      <div className="absolute inset-[-4.06%_-4.06%_-4.06%_-4.05%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.9977 19.9931">
          <g id="Phone">
            <path d={svgPaths.p2cc32600} fill="var(--fill-0, white)" fillOpacity="0.67" id="Vector" stroke="var(--stroke-0, #141718)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function IconText() {
  return (
    <div className="absolute contents left-[60.75px] top-[331px]" data-name="Icon - Text">
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[101px] not-italic text-[#acadb9] text-[14px] top-[calc(50%-117px)] tracking-[-0.28px] whitespace-nowrap">+00 0000000 000</p>
      <Phone />
    </div>
  );
}

function PhoneNumber() {
  return (
    <div className="absolute contents left-[35px] top-[309px]" data-name="Phone Number">
      <div className="absolute bg-white inset-[34.49%_8.45%_58.2%_8.45%] rounded-[12.84px]" />
      <IconText />
    </div>
  );
}

function InputField() {
  return (
    <div className="absolute contents left-[35px] top-[163.81px]" data-name="Input Field">
      <PhoneNumber />
      <div className="[word-break:break-word] absolute font-['Poppins:SemiBold',sans-serif] leading-[0] left-[35px] not-italic text-[#323142] text-[38px] top-[163.81px] tracking-[-1.52px] w-[336px]">
        <p className="leading-[1.25] mb-0">Enter Your Phone</p>
        <p className="leading-[1.25]">Number</p>
      </div>
    </div>
  );
}

function Back() {
  return (
    <div className="absolute inset-[5.02%_80.68%_89.96%_8.45%]" data-name="Back">
      <div className="absolute inset-[-26.32%_-65.79%_-78.95%_-39.47%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 92.3684 92.3684">
          <g id="Back">
            <g filter="url(#filter0_d_1_3963)" id="Rectangle 105">
              <path d={svgPaths.p20b986b0} fill="var(--fill-0, white)" fillOpacity="0.67" />
            </g>
            <path d={svgPaths.p2004d880} id="Path 3391" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.36842" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="92.3684" id="filter0_d_1_3963" width="92.3684" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dx="5.92105" dy="11.8421" />
              <feGaussianBlur stdDeviation="11.8421" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.827451 0 0 0 0 0.819608 0 0 0 0 0.847059 0 0 0 0.3 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_3963" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_3963" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export default function PhoneNumberActive() {
  return (
    <div className="bg-[#f7f8fa] overflow-clip relative rounded-[18px] size-full" data-name="Phone Number - Active 1">
      <Buttons />
      <InputField />
      <Back />
    </div>
  );
}