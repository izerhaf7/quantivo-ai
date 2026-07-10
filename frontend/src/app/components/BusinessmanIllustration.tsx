import { motion } from "motion/react";
import { Sparkles, Brain, ArrowUpRight, Cpu, TrendingUp, Landmark, ShieldCheck } from "lucide-react";

interface IllustrationProps {
  slide: number;
}

export function BusinessmanIllustration({ slide }: IllustrationProps) {
  // Common 3D Clay Shading Filters
  const renderFilters = (
    <defs>
      {/* 3D clay bevel/soft shadow filter */}
      <filter id="clay-bevel" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feSpecularLighting in="blur" specularExponent="15" specularConstant="1" lightingColor="#ffffff" result="spec">
          <fePointLight x="100" y="80" z="150" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k2="1" k3="0.55" result="lit" />
        <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.12" />
      </filter>

      {/* Radial and Linear Gradients for rich 3D shading */}
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2EC" />
        <stop offset="60%" stopColor="#FED7C7" />
        <stop offset="100%" stopColor="#F9A482" />
      </linearGradient>

      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2D3142" />
        <stop offset="100%" stopColor="#11131C" />
      </linearGradient>

      <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>

      <linearGradient id="tieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="40%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>

      <radialGradient id="glowBulb" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>

      <linearGradient id="aiScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
      </linearGradient>
    </defs>
  );

  // Slide 1: Thinking Pose Businessman
  if (slide === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#FFFDF9] via-[#FFFBF0] to-[#FFF4DF] flex flex-col items-center justify-center relative p-6 overflow-hidden select-none">
        {/* Background ambient halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-amber-300/20 to-yellow-100/30 blur-3xl" />
        
        {/* Main 3D Vector Character canvas */}
        <svg className="w-full h-full max-h-[300px]" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderFilters}
          
          {/* Ambient particle sparkles */}
          <g className="animate-pulse">
            <circle cx="50" cy="80" r="3" fill="#F59E0B" opacity="0.4" />
            <circle cx="260" cy="120" r="4" fill="#F59E0B" opacity="0.5" />
            <circle cx="70" cy="220" r="2.5" fill="#F59E0B" opacity="0.3" />
          </g>

          {/* Glowing Idea Cloud trails */}
          <path d="M 120 70 Q 110 50, 130 40 Q 155 35, 170 50" stroke="#FEE2E2" strokeWidth="3" strokeDasharray="5 5" opacity="0.6" />
          
          {/* Businessman Body */}
          <g filter="url(#clay-bevel)">
            {/* Shoulders / Suit */}
            <path d="M 80 270 C 80 230, 220 230, 220 270 Z" fill="url(#suitGrad)" />
            {/* White Shirt Collar */}
            <path d="M 130 230 L 150 248 L 170 230 Z" fill="#FFFFFF" />
            {/* Elegant Tie */}
            <path d="M 144 240 L 156 240 L 153 285 L 147 285 Z" fill="url(#tieGrad)" />
            
            {/* Neck */}
            <rect x="138" y="210" width="24" height="25" rx="10" fill="url(#skinGrad)" />
            
            {/* Head */}
            <ellipse cx="150" cy="165" rx="36" ry="42" fill="url(#skinGrad)" />
            
            {/* Cute Rounded Ears */}
            <circle cx="112" cy="168" r="8" fill="url(#skinGrad)" />
            <circle cx="188" cy="168" r="8" fill="url(#skinGrad)" />

            {/* Smart 3D Clay Hair */}
            <path d="M 110 155 C 110 110, 190 110, 190 155 C 190 150, 182 135, 172 135 C 160 135, 150 142, 138 135 C 122 135, 110 148, 110 155 Z" fill="url(#hairGrad)" />
            {/* Trendy side lock */}
            <path d="M 112 152 L 115 168 L 122 160 Z" fill="url(#hairGrad)" />
            <path d="M 188 152 L 185 168 L 178 160 Z" fill="url(#hairGrad)" />

            {/* Eyebrows matching 'thinking' emotion (one raised, one lowered/puzzled) */}
            <path d="M 125 148 Q 133 145, 138 149" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 160 142 Q 168 138, 174 140" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Thinking Eyes (looking up-right towards the idea) */}
            <ellipse cx="134" cy="157" rx="4" ry="4.5" fill="#1E293B" />
            <circle cx="135.5" cy="155.5" r="1.2" fill="#FFFFFF" />
            
            <ellipse cx="166" cy="155" rx="4" ry="4.5" fill="#1E293B" />
            <circle cx="167.5" cy="153.5" r="1.2" fill="#FFFFFF" />

            {/* Thoughtful light smirk */}
            <path d="M 140 188 Q 150 193, 158 187" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />

            {/* Hand-to-chin thinking gesture */}
            {/* Arm coming from side */}
            <path d="M 180 270 Q 185 220, 158 202" stroke="url(#suitGrad)" strokeWidth="18" strokeLinecap="round" />
            {/* Hand holding chin */}
            <circle cx="150" cy="198" r="9" fill="url(#skinGrad)" />
            <circle cx="145" cy="201" r="5" fill="url(#skinGrad)" />
          </g>

          {/* Floating glowing 3D lightbulb (The Idea) */}
          <g className="animate-bounce" style={{ animationDuration: '3s' }}>
            {/* Outer yellow halo glow */}
            <circle cx="215" cy="90" r="35" fill="url(#glowBulb)" />
            
            {/* 3D bulb frame */}
            <g filter="url(#clay-bevel)">
              <circle cx="215" cy="85" r="16" fill="url(#bulbGrad)" />
              <path d="M 205 93 L 225 93 L 220 108 L 210 108 Z" fill="url(#bulbGrad)" />
              {/* Metallic Base */}
              <rect x="209" y="108" width="12" height="4" rx="1.5" fill="#94A3B8" />
              <rect x="211" y="113" width="8" height="3" rx="1" fill="#64748B" />
              {/* Internal shiny highlight */}
              <circle cx="211" cy="80" r="4" fill="#FFFFFF" opacity="0.4" />
            </g>
          </g>
        </svg>

        {/* Floating high-end visual badges */}
        <div className="absolute top-1/4 left-5 px-3 py-1.5 bg-white/95 rounded-2xl shadow-md border border-white/80 text-amber-500 text-[11px] font-bold tracking-wider flex items-center gap-1 animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '3.5s' }}>
          <Brain size={13} className="text-amber-500" />
          <span>STRATEGI</span>
        </div>
        <div className="absolute bottom-1/4 right-5 px-3 py-1.5 bg-white/95 rounded-2xl shadow-md border border-white/80 text-blue-500 text-[11px] font-bold tracking-wider flex items-center gap-1 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '4s' }}>
          <Sparkles size={13} className="text-blue-500" />
          <span>IDEABOX</span>
        </div>
      </div>
    );
  }

  // Slide 2: Consulting Pose Businessman (Personal AI Agent)
  if (slide === 1) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#F0F5FF] via-[#E8F0FE] to-[#DCE9FC] flex flex-col items-center justify-center relative p-6 overflow-hidden select-none">
        {/* Background ambient halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-300/20 to-emerald-100/30 blur-3xl" />
        
        {/* Main 3D Vector Character canvas */}
        <svg className="w-full h-full max-h-[300px]" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderFilters}
          
          {/* Cyber connection lines linking character to screen */}
          <line x1="150" y1="130" x2="60" y2="100" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <line x1="150" y1="230" x2="60" y2="180" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />

          {/* Businessman Body */}
          <g filter="url(#clay-bevel)">
            {/* Shoulders / Suit */}
            <path d="M 85 270 C 85 230, 225 230, 225 270 Z" fill="url(#suitGrad)" />
            {/* White Shirt Collar */}
            <path d="M 135 230 L 155 248 L 175 230 Z" fill="#FFFFFF" />
            {/* Elegant Tie */}
            <path d="M 149 240 L 161 240 L 158 285 L 152 285 Z" fill="url(#tieGrad)" />
            
            {/* Neck */}
            <rect x="143" y="210" width="24" height="25" rx="10" fill="url(#skinGrad)" />
            
            {/* Head (facing slightly left towards screen) */}
            <ellipse cx="155" cy="165" rx="36" ry="42" fill="url(#skinGrad)" />
            
            {/* Cute Rounded Ears */}
            <circle cx="118" cy="168" r="8" fill="url(#skinGrad)" />
            <circle cx="192" cy="168" r="8" fill="url(#skinGrad)" />

            {/* Smart 3D Clay Hair */}
            <path d="M 115 155 C 115 110, 195 110, 195 155 C 195 150, 187 135, 177 135 C 165 135, 155 142, 143 135 C 127 135, 115 148, 115 155 Z" fill="url(#hairGrad)" />
            {/* Trendy side locks */}
            <path d="M 117 152 L 120 168 L 127 160 Z" fill="url(#hairGrad)" />

            {/* Smart Eyebrows (smiling & interactive expression) */}
            <path d="M 128 144 Q 136 141, 141 144" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 161 144 Q 169 141, 174 144" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Happy Eyes looking at the Screen */}
            <ellipse cx="134" cy="154" rx="4.5" ry="4.5" fill="#1E293B" />
            <circle cx="132.5" cy="152.5" r="1.2" fill="#FFFFFF" />
            
            <ellipse cx="166" cy="154" rx="4.5" ry="4.5" fill="#1E293B" />
            <circle cx="164.5" cy="152.5" r="1.2" fill="#FFFFFF" />

            {/* Large Friendly Smile */}
            <path d="M 140 180 Q 152 195, 164 180" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" />
            
            {/* Interacting Hand pointing at screen */}
            <path d="M 100 270 Q 90 225, 78 200" stroke="url(#suitGrad)" strokeWidth="15" strokeLinecap="round" />
            <circle cx="78" cy="196" r="7" fill="url(#skinGrad)" />
            {/* Pointer finger */}
            <path d="M 78 196 L 70 192" stroke="url(#skinGrad)" strokeWidth="4.5" strokeLinecap="round" />
          </g>

          {/* Futuristic Glowing AI Interface Screen (Glassmorphic) */}
          <g className="animate-bounce" style={{ animationDuration: '4s' }}>
            {/* Glow backing */}
            <rect x="25" y="65" width="85" height="115" rx="16" fill="#10B981" opacity="0.08" filter="blur(8px)" />
            
            {/* Glass screen */}
            <rect x="25" y="65" width="85" height="115" rx="16" fill="url(#aiScreenGrad)" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
            
            {/* Screen layout UI */}
            {/* Top Bar */}
            <rect x="35" y="75" width="40" height="6" rx="3" fill="#10B981" opacity="0.6" />
            <circle cx="95" cy="78" r="3" fill="#3B82F6" />
            
            {/* Mini Charts in Screen */}
            <path d="M 35 110 L 50 100 L 65 115 L 80 90 L 95 95" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="80" cy="90" r="3" fill="#10B981" />
            
            {/* Text lines */}
            <rect x="35" y="130" width="65" height="4" rx="2" fill="#475569" opacity="0.3" />
            <rect x="35" y="140" width="50" height="4" rx="2" fill="#475569" opacity="0.3" />
            <rect x="35" y="150" width="58" height="4" rx="2" fill="#10B981" opacity="0.4" />
          </g>
        </svg>

        {/* Floating AI badge */}
        <div className="absolute top-1/4 right-5 px-3 py-1.5 bg-white/95 rounded-2xl shadow-md border border-white/80 text-emerald-500 text-[11px] font-bold tracking-wider flex items-center gap-1 animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '3.6s' }}>
          <Cpu size={13} className="text-emerald-500" />
          <span>PERSONAL AI</span>
        </div>
        <div className="absolute bottom-1/4 left-5 px-3 py-1.5 bg-white/95 rounded-2xl shadow-md border border-white/80 text-blue-500 text-[11px] font-bold tracking-wider flex items-center gap-1 animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '4.2s' }}>
          <ShieldCheck size={13} className="text-blue-500" />
          <span>DATA SECURE</span>
        </div>
      </div>
    );
  }

  // Slide 3: Gaining Profit Businessman (Strategic Plan)
  if (slide === 2) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#E6F9F5] via-[#D5F5EE] to-[#C1EFE4] flex flex-col items-center justify-center relative p-6 overflow-hidden select-none">
        {/* Background ambient halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-300/20 to-teal-100/30 blur-3xl" />
        
        {/* Main 3D Vector Character canvas */}
        <svg className="w-full h-full max-h-[300px]" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderFilters}

          {/* Golden success sparkles background */}
          <g className="animate-pulse">
            <path d="M 40 100 L 45 105 L 40 110 L 35 105 Z" fill="#F59E0B" />
            <path d="M 260 70 L 265 75 L 260 80 L 255 75 Z" fill="#F59E0B" />
          </g>

          {/* Upward Profit Trend Line */}
          <path d="M 30 220 Q 100 200, 150 120 T 270 40" stroke="#10B981" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <path d="M 255 40 L 270 40 L 270 55" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />

          {/* Businessman Body */}
          <g filter="url(#clay-bevel)">
            {/* Shoulders / Suit */}
            <path d="M 80 270 C 80 230, 220 230, 220 270 Z" fill="url(#suitGrad)" />
            {/* White Shirt Collar */}
            <path d="M 130 230 L 150 248 L 170 230 Z" fill="#FFFFFF" />
            {/* Elegant Tie */}
            <path d="M 144 240 L 156 240 L 153 285 L 147 285 Z" fill="url(#tieGrad)" />
            
            {/* Neck */}
            <rect x="138" y="210" width="24" height="25" rx="10" fill="url(#skinGrad)" />
            
            {/* Head (Highly Celebratory Face!) */}
            <ellipse cx="150" cy="165" rx="36" ry="42" fill="url(#skinGrad)" />
            
            {/* Cute Rounded Ears */}
            <circle cx="112" cy="168" r="8" fill="url(#skinGrad)" />
            <circle cx="188" cy="168" r="8" fill="url(#skinGrad)" />

            {/* Smart 3D Clay Hair */}
            <path d="M 110 155 C 110 110, 190 110, 190 155 C 190 150, 182 135, 172 135 C 160 135, 150 142, 138 135 C 122 135, 110 148, 110 155 Z" fill="url(#hairGrad)" />

            {/* Expressive eyebrows raised up in excitement */}
            <path d="M 124 140 Q 132 134, 140 140" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 160 140 Q 168 134, 176 140" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Happy eyes closed in pure joy (laughing/smiling arc) */}
            <path d="M 126 156 Q 134 148, 142 156" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 158 156 Q 166 148, 174 156" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

            {/* Wide Open Cheering/Laughing Mouth */}
            <path d="M 135 178 C 135 178, 138 198, 150 198 C 162 198, 165 178, 165 178 Z" fill="#9A3412" />
            {/* Red tongue inside */}
            <path d="M 142 190 C 144 184, 156 184, 158 190 Z" fill="#EF4444" />

            {/* Left Celebrating Arm raised up */}
            <path d="M 90 260 Q 60 210, 50 180" stroke="url(#suitGrad)" strokeWidth="15" strokeLinecap="round" />
            <circle cx="50" cy="176" r="7.5" fill="url(#skinGrad)" />

            {/* Right Celebrating Arm raised up */}
            <path d="M 210 260 Q 240 210, 250 180" stroke="url(#suitGrad)" strokeWidth="15" strokeLinecap="round" />
            <circle cx="250" cy="176" r="7.5" fill="url(#skinGrad)" />
          </g>

          {/* Polished 3D Gold Coins Stack (gaining profit) */}
          <g className="animate-bounce" style={{ animationDuration: '3.5s' }}>
            <g filter="url(#clay-bevel)">
              {/* Bottom Coin */}
              <ellipse cx="60" cy="110" rx="14" ry="5" fill="url(#coinGrad)" />
              <rect x="46" y="110" width="28" height="6" fill="url(#coinGrad)" />
              <ellipse cx="60" cy="116" rx="14" ry="5" fill="url(#coinGrad)" />

              {/* Middle Coin */}
              <ellipse cx="60" cy="100" rx="14" ry="5" fill="url(#coinGrad)" />
              <rect x="46" y="100" width="28" height="6" fill="url(#coinGrad)" />
              <ellipse cx="60" cy="106" rx="14" ry="5" fill="url(#coinGrad)" />

              {/* Top Coin */}
              <ellipse cx="60" cy="90" rx="14" ry="5" fill="url(#coinGrad)" />
              <rect x="46" y="90" width="28" height="6" fill="url(#coinGrad)" />
              <ellipse cx="60" cy="96" rx="14" ry="5" fill="url(#coinGrad)" />
              {/* Top Face rim */}
              <ellipse cx="60" cy="90" rx="11" ry="3.5" fill="#FEF08A" opacity="0.6" />
            </g>
          </g>

          {/* Second Stack of Coins */}
          <g className="animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
            <g filter="url(#clay-bevel)">
              <ellipse cx="240" cy="120" rx="14" ry="5" fill="url(#coinGrad)" />
              <rect x="226" y="120" width="28" height="6" fill="url(#coinGrad)" />
              <ellipse cx="240" cy="126" rx="14" ry="5" fill="url(#coinGrad)" />

              <ellipse cx="240" cy="110" rx="14" ry="5" fill="url(#coinGrad)" />
              <rect x="226" y="110" width="28" height="6" fill="url(#coinGrad)" />
              <ellipse cx="240" cy="116" rx="14" ry="5" fill="url(#coinGrad)" />
              <ellipse cx="240" cy="110" rx="11" ry="3.5" fill="#FEF08A" opacity="0.6" />
            </g>
          </g>
        </svg>

        {/* Floating Profit statistics badge */}
        <div className="absolute top-1/4 left-5 px-3 py-1.5 bg-white/95 rounded-2xl shadow-md border border-white/80 text-emerald-500 text-[11px] font-bold tracking-wider flex items-center gap-1 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '3.8s' }}>
          <TrendingUp size={13} className="text-emerald-500" />
          <span>PROFIT +34%</span>
        </div>
        <div className="absolute bottom-1/4 right-5 px-3 py-1.5 bg-white/95 rounded-2xl shadow-md border border-white/80 text-amber-500 text-[11px] font-bold tracking-wider flex items-center gap-1 animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '4.4s' }}>
          <Landmark size={13} className="text-amber-500" />
          <span>OMSET NAIK</span>
        </div>
      </div>
    );
  }

  return null;
}
