import svgPaths from "./svg-97yu6l8mgy";
import imgRectangle3537 from "./a9c36a9fb8b061c69da4c05b701987db5e2fa8dd.png";
import imgImage2 from "./23a6436318251671a9de1d7884a9625d300efcb7.png";

function Slider() {
  return (
    <div className="absolute inset-[63.17%_41.82%_34.93%_41.79%]" data-name="Slider">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 67.884 17">
        <g id="Slider">
          <path d={svgPaths.pfdb0270} fill="var(--fill-0, #23262F)" fillOpacity="0.5" id="Ellipse 19" />
          <path d={svgPaths.p33f15d00} fill="var(--fill-0, #23262F)" fillOpacity="0.5" id="Ellipse 20" />
          <g id="Slide ">
            <path d={svgPaths.p151b2b00} fill="var(--fill-0, #141718)" id="Ellipse 18" />
            <g id="Ellipse 21">
              <g id="Vector" />
              <path d={svgPaths.p14acb800} id="Vector_2" stroke="var(--stroke-0, #141718)" strokeWidth="0.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RoboImage() {
  return (
    <div className="absolute contents left-[25px] top-[98px]" data-name="Robo Image">
      <div className="absolute blur-[35px] h-[413px] left-[25px] rounded-[33.049px] top-[141px] w-[362px]">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[33.049px] size-full" src={imgRectangle3537} />
      </div>
      <div className="absolute h-[439px] left-[39px] rounded-[33.5px] top-[98px] w-[336px]" data-name="image 2">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[33.5px]">
          <img alt="" className="absolute h-[192.48%] left-[-15.72%] max-w-none top-[-6.39%] w-[127.76%]" src={imgImage2} />
        </div>
      </div>
    </div>
  );
}

function Skip() {
  return (
    <a className="absolute contents cursor-pointer inset-[4.58%_10.87%_91.96%_78.99%]" data-name="Skip">
      <p className="[word-break:break-word] absolute font-['Poppins:SemiBold',sans-serif] inset-[4.58%_10.87%_91.96%_78.99%] leading-[normal] not-italic text-[#d7d7d7] text-[18px]">Skip</p>
    </a>
  );
}

function Text() {
  return (
    <div className="-translate-x-1/2 absolute bottom-[21.32%] contents left-[calc(50%-5px)] top-[67.3%]" data-name="Text">
      <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[21.32%] font-['Poppins:Bold',sans-serif] leading-[50.851px] left-[calc(50%-5px)] not-italic text-[#23262f] text-[33.901px] text-center top-[67.3%] tracking-[-0.678px] whitespace-nowrap">
        Gain Profit with
        <br aria-hidden />
        Strategic Plan
      </p>
    </div>
  );
}

function Frame1() {
  return <div className="bg-[#e6e8ec] h-[24px] relative rounded-[2px] shrink-0 w-[2px]" />;
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[32px] items-center justify-center relative shrink-0">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="overflow-clip relative size-[24px]" data-name="icons/Arrow Right 2/Line">
            <div className="absolute inset-[29.17%_20.83%_33.33%_20.83%]" data-name="vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 9.00001">
                <path clipRule="evenodd" d={svgPaths.p43bfc00} fill="var(--fill-0, #23262F)" fillRule="evenodd" id="vector (Stroke)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Frame1 />
      <div className="flex items-center justify-center relative shrink-0">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="overflow-clip relative size-[24px]" data-name="icons/Arrow Left 2/Line">
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
        </div>
      </div>
    </div>
  );
}

function Nagigator() {
  return (
    <a className="absolute bg-[#fcfcfd] bottom-[32px] content-stretch cursor-pointer drop-shadow-[0px_40px_16px_rgba(15,15,15,0.12)] flex flex-col items-center justify-center left-[129px] p-[20px] rounded-[16px]" data-name="nagigator">
      <Frame />
    </a>
  );
}

export default function OnBoarding() {
  return (
    <div className="bg-[#f7f8fa] overflow-clip relative rounded-[18px] size-full" data-name="On-Boarding 9">
      <Slider />
      <RoboImage />
      <Skip />
      <Text />
      <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[13.9%] font-['Poppins:Light',sans-serif] leading-[28.943px] left-[calc(50%-0.03px)] not-italic text-[#8e9295] text-[16.3px] text-center top-[79.24%] w-[337.947px]">AI Agent will give you the best strategy and make u the great businessman.</p>
      <Nagigator />
    </div>
  );
}