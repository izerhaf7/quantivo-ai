import svgPaths from "./svg-bppyfbt9om";
import imgRectangle3537 from "./89358fb3282a409608ef5a52e7dec93049cdde72.png";
import imgGeminiGeneratedImageBl44L1Bl44L1Bl441 from "./ca900df8a9791f1785a233a7b8768c7004b44ba3.png";

function Slider() {
  return (
    <div className="absolute inset-[63.28%_42.39%_34.75%_42.75%]" data-name="Slider">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 61.5085 17.6792">
        <g id="Slider">
          <path d={svgPaths.p63d3280} fill="var(--fill-0, #23262F)" fillOpacity="0.5" id="Ellipse 19" />
          <path d={svgPaths.p91ce600} fill="var(--fill-0, #23262F)" fillOpacity="0.5" id="Ellipse 20" />
          <g id="slide">
            <path d={svgPaths.p15139280} fill="var(--fill-0, #141718)" id="Ellipse 18" />
            <g id="Ellipse 21">
              <g id="Vector" />
              <path d={svgPaths.p366309f0} id="Vector_2" stroke="var(--stroke-0, #141718)" strokeWidth="0.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RobotImage() {
  return (
    <div className="absolute contents left-[26px] top-[95px]" data-name="Robot Image">
      <div className="absolute blur-[35px] h-[414px] left-[26px] rounded-[35.607px] top-[136px] w-[362px]">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[35.607px] size-full" src={imgRectangle3537} />
      </div>
      <div className="absolute h-[438px] left-[40px] rounded-[33.5px] top-[95px] w-[334px]" data-name="Gemini_Generated_Image_bl44l1bl44l1bl44 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[33.5px]">
          <img alt="" className="absolute h-[193.33%] left-[-16.01%] max-w-none top-[-5%] w-[128.89%]" src={imgGeminiGeneratedImageBl44L1Bl44L1Bl441} />
        </div>
      </div>
    </div>
  );
}

function Skip() {
  return (
    <div className="absolute contents inset-[4.58%_10.87%_91.96%_78.99%]" data-name="Skip">
      <p className="[word-break:break-word] absolute font-['Poppins:SemiBold',sans-serif] inset-[4.58%_10.87%_91.96%_78.99%] leading-[normal] not-italic text-[#d7d7d7] text-[18px]">Skip</p>
    </div>
  );
}

function Text() {
  return (
    <div className="[word-break:break-word] absolute bottom-[12.1%] contents left-[28.17px] not-italic text-center top-[67.08%]" data-name="Text">
      <p className="-translate-x-1/2 absolute bottom-[21.54%] font-['Poppins:Bold',sans-serif] leading-[50.851px] left-[calc(50%+5.67px)] text-[#23262f] text-[33.901px] top-[67.08%] tracking-[-0.678px] whitespace-nowrap">
        Ever Think About
        <br aria-hidden />
        Great Business Ideas?
      </p>
      <p className="absolute font-['Poppins:Light',sans-serif] inset-[81.04%_7.98%_12.1%_10.39%] leading-[28.943px] text-[#8e9295] text-[16.3px]">Don’t know where to develop these ideas?</p>
    </div>
  );
}

function Frame1() {
  return <div className="bg-[#e6e8ec] h-[24px] relative rounded-[2px] shrink-0 w-[2px]" />;
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[32px] items-center justify-center relative shrink-0">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="icons/Arrow Left 2/Line">
        <div className="absolute flex inset-[29.17%_20.83%_33.33%_20.83%] items-center justify-center" style={{ containerType: "size" }}>
          <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
            <div className="relative size-full" data-name="vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 9.00001">
                <path clipRule="evenodd" d={svgPaths.p43bfc00} fill="var(--fill-0, #B1B5C4)" fillRule="evenodd" id="vector (Stroke)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Frame1 />
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="icons/Arrow Right 2/Line">
        <div className="absolute inset-[29.17%_20.83%_33.33%_20.83%]" data-name="vector (Stroke)">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 9.00001">
            <path clipRule="evenodd" d={svgPaths.p43bfc00} fill="var(--fill-0, #23262F)" fillRule="evenodd" id="vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Nagigator() {
  return (
    <div className="absolute bg-[#fcfcfd] bottom-[32px] content-stretch drop-shadow-[0px_40px_16px_rgba(15,15,15,0.12)] flex flex-col items-center justify-center left-[129px] p-[20px] rounded-[16px]" data-name="nagigator">
      <Frame />
    </div>
  );
}

export default function OnBoarding() {
  return (
    <div className="bg-[#f7f8fa] overflow-clip relative rounded-[18px] size-full" data-name="On-Boarding 7">
      <Slider />
      <RobotImage />
      <Skip />
      <Text />
      <Nagigator />
    </div>
  );
}