import svgPaths from "./svg-0yw5moqofm";
import imgRectangle3537 from "./ed5566f1821d03d1901b40c8893c1d42499d4eb5.png";
import imgImage1 from "./3a5bbef7c9abca0d4eddbff08dd6ca1f1f2eb2af.png";

function Slider() {
  return (
    <div className="absolute inset-[63.17%_39.57%_34.86%_43.96%]" data-name="Slider">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 68.1911 17.6792">
        <g id="Slider">
          <path d={svgPaths.p2c384100} fill="var(--fill-0, #23262F)" fillOpacity="0.5" id="Ellipse 19" />
          <path d={svgPaths.p12de7680} fill="var(--fill-0, #23262F)" fillOpacity="0.5" id="Ellipse 20" />
          <g id="Slide">
            <path d={svgPaths.p8aea600} fill="var(--fill-0, #141718)" id="Ellipse 18" />
            <g id="Ellipse 21">
              <g id="Vector" />
              <path d={svgPaths.p372e6a00} id="Vector_2" stroke="var(--stroke-0, #141718)" strokeWidth="0.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RobotImg() {
  return (
    <div className="absolute contents left-[28px] top-[94px]" data-name="Robot Img">
      <div className="absolute blur-[35px] h-[402px] left-[28px] rounded-[33.049px] top-[145px] w-[354px]">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[33.049px] size-full" src={imgRectangle3537} />
      </div>
      <div className="-translate-x-1/2 absolute h-[456px] left-[calc(50%+4.5px)] rounded-[33.5px] top-[94px] w-[349px]" data-name="image 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[33.5px]">
          <img alt="" className="absolute h-[192.48%] left-[-15.23%] max-w-none top-[-6.39%] w-[127.76%]" src={imgImage1} />
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
    <div className="-translate-x-1/2 absolute bottom-[21.09%] contents left-[calc(50%+8.5px)] top-[67.52%]" data-name="Text">
      <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[21.09%] font-['Poppins:Bold',sans-serif] leading-[50.851px] left-[calc(50%+8.5px)] not-italic text-[#23262f] text-[33.901px] text-center top-[67.52%] tracking-[-0.678px] whitespace-pre">
        {`Consult it with `}
        <br aria-hidden />
        Personal AI Agent
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
    <div className="bg-[#f7f8fa] overflow-clip relative rounded-[18px] size-full" data-name="On-Boarding 8">
      <Slider />
      <RobotImg />
      <Skip />
      <Text />
      <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[13.9%] font-['Poppins:Light',sans-serif] leading-[28.943px] left-[calc(50%-0.03px)] not-italic text-[#8e9295] text-[16.3px] text-center top-[79.24%] w-[337.947px]">Find the best solutions and insight about your ideas based on data!</p>
      <Nagigator />
    </div>
  );
}