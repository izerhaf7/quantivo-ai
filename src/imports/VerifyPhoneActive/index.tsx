import svgPaths from "./svg-odllmsl2wr";

function Later() {
  return (
    <div className="absolute contents left-[35px] top-[484px]" data-name="Later">
      <div className="absolute bg-[#c8eeea] inset-[54.02%_8.45%_38.67%_8.45%] rounded-[14px]" />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[187px] not-italic text-[#141718] text-[16px] top-[505.29px] whitespace-nowrap">Later</p>
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
      <p className="[word-break:break-word] absolute font-['Poppins:SemiBold',sans-serif] leading-[normal] left-[101px] not-italic text-[#141718] text-[14px] top-[calc(50%-117px)] tracking-[-0.28px] whitespace-nowrap">+00 0000000 000</p>
      <Phone />
    </div>
  );
}

function PhoneNumber() {
  return (
    <div className="absolute contents left-[35px] top-[309px]" data-name="Phone Number">
      <div className="absolute bg-white border-2 border-[#141718] border-solid inset-[34.49%_8.45%_58.2%_8.45%] rounded-[12.84px]" />
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

function Verify() {
  return (
    <div className="absolute contents left-[61px] top-[455px]" data-name="Verify">
      <div className="absolute bg-[#141718] inset-[50.78%_12.8%_41.85%_14.73%] rounded-[14px]" />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[188px] not-italic text-[#f3f5f6] text-[16px] top-[476px] w-[46px]">Verify</p>
    </div>
  );
}

function SendAgain() {
  return (
    <div className="absolute contents left-[60px] top-[533px]" data-name="Send Again">
      <div className="absolute bg-[#e3e3e3] inset-[59.49%_13.04%_33.15%_14.49%] rounded-[14px]" />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[163.5px] not-italic text-[#cdcdcd] text-[16px] top-[554px] whitespace-nowrap">Send Again</p>
    </div>
  );
}

function Buttons1() {
  return (
    <div className="absolute contents left-[60px] top-[455px]" data-name="Buttons">
      <Verify />
      <SendAgain />
    </div>
  );
}

function Component4th() {
  return (
    <div className="absolute contents left-[293px] top-[350px]" data-name="4th">
      <div className="absolute border-2 border-[#141718] border-solid left-[293px] rounded-[13px] size-[60px] top-[350px]" />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['IBM_Plex_Serif:Light',sans-serif] justify-center leading-[0] left-[310px] not-italic text-[#141718] text-[41.857px] top-[380px] tracking-[-0.8371px] whitespace-nowrap">
        <p className="leading-[1.1]">6</p>
      </div>
    </div>
  );
}

function Component3rd() {
  return (
    <div className="absolute contents left-[216px] top-[350px]" data-name="3rd">
      <div className="absolute border-2 border-[#141718] border-solid left-[216px] rounded-[13px] size-[60px] top-[350px]" />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['IBM_Plex_Serif:Light',sans-serif] justify-center leading-[0] left-[233px] not-italic text-[#141718] text-[41.857px] top-[380px] tracking-[-0.8371px] whitespace-nowrap">
        <p className="leading-[1.1]">9</p>
      </div>
    </div>
  );
}

function Component2nd() {
  return (
    <div className="absolute contents left-[139px] top-[350px]" data-name="2nd">
      <div className="absolute border-2 border-[#141718] border-solid left-[139px] rounded-[13px] size-[60px] top-[350px]" />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['IBM_Plex_Serif:Light',sans-serif] justify-center leading-[0] left-[156px] not-italic text-[#141718] text-[41.857px] top-[380px] tracking-[-0.8371px] whitespace-nowrap">
        <p className="leading-[1.1]">5</p>
      </div>
    </div>
  );
}

function Component1st() {
  return (
    <div className="absolute contents left-[62px] top-[350px]" data-name="1st">
      <div className="absolute border-2 border-[#141718] border-solid left-[62px] rounded-[13px] size-[60px] top-[350px]" />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['IBM_Plex_Serif:Light',sans-serif] justify-center leading-[0] left-[79px] not-italic text-[#141718] text-[41.857px] top-[380px] tracking-[-0.8371px] whitespace-nowrap">
        <p className="leading-[1.1]">8</p>
      </div>
    </div>
  );
}

function Boxes() {
  return (
    <div className="absolute contents left-[62px] top-[350px]" data-name="Boxes">
      <Component4th />
      <Component3rd />
      <Component2nd />
      <Component1st />
    </div>
  );
}

function Text() {
  return (
    <div className="[word-break:break-word] absolute contents left-[58px] not-italic top-[199px]" data-name="Text">
      <p className="absolute font-['Poppins:SemiBold',sans-serif] leading-[normal] left-[146px] text-[#acadb9] text-[15px] top-[298px] tracking-[-0.3px] whitespace-nowrap">+00 000000 0000</p>
      <p className="absolute font-['Poppins:Regular',sans-serif] leading-[1.5] left-[58px] text-[#acadb9] text-[14px] top-[238px] w-[305px]">We Have Sent Code To Your Phone Number</p>
      <p className="absolute font-['Poppins:SemiBold',sans-serif] leading-[1.25] left-[100px] text-[#323142] text-[22px] top-[199px] tracking-[-0.88px] whitespace-nowrap">Verify Phone Number</p>
    </div>
  );
}

function VerificationPopUp() {
  return (
    <div className="absolute contents left-[58px] top-[199px]" data-name="Verification PopUp">
      <Buttons1 />
      <Boxes />
      <Text />
    </div>
  );
}

function Popup() {
  return (
    <div className="absolute contents left-[32px] top-[159px]" data-name="Popup">
      <div className="absolute bg-[#f7f8fa] h-[502px] left-[32px] rounded-[27px] shadow-[0px_13.316px_55.484px_0px_rgba(37,31,48,0.05)] top-[159px] w-[350px]" data-name="BG" />
      <VerificationPopUp />
      <p className="[word-break:break-word] absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-[61px] not-italic text-[#acadb9] text-[14.388px] top-[419px] tracking-[-0.2878px] whitespace-nowrap">(04:30)</p>
    </div>
  );
}

export default function VerifyPhoneActive() {
  return (
    <div className="bg-[#f3f5f6] overflow-clip relative rounded-[18px] size-full" data-name="Verify Phone - Active">
      <Buttons />
      <InputField />
      <div className="absolute h-[896px] left-0 top-0 w-[414px]" data-name="BG Laer Blur">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 414 896">
          <path d="M0 0H414V896H0V0Z" fill="var(--fill-0, #DEDFE1)" id="BG Laer Blur" />
        </svg>
      </div>
      <Back />
      <Popup />
    </div>
  );
}