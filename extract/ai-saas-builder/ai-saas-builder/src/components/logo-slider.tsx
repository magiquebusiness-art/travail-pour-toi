"use client";

const logos = [
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0bc865247_660494e7a0cf5065544c0ad5_zMLmTLSpnMorH4Hc-PJ_Rr2Rcyr9kYi7uERsxycWPFk.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0bafe0d4f_hostgator-logo-600x338-52-1488290815.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0b9a78eef_bluehost-logo-600x338-30-1488294230.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0b86711b1_Capcut-Logo-PNG.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0b7249002_TikTok_logo.svg.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0b5fe1bfb_png-clipart-logo-corel-videostudio-coreldraw-corel-painter-business-blue-text.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0aefd81fa_Zoom-Logo.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0ac7a1d15_logo-systeme-io-removebg-preview__1_-removebg-preview-728x195.webp",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/680c0a9839e4a_Shopify_logo_2018.svg.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68168e2531d90_Manychat.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68168e505c668_aweber.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68168e62604a0_Car_Trawler-removebg-preview.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68168e79b1562_CyberLink-removebg-preview.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68168e8edc93d_InterPromo_GmbH-removebg-preview.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68168ea621917_My_M_M_s-removebg-preview.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68169282b5559_Chocolat.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/6816926ce79d7_Roxio.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/68169252e532e_Botanic.png",
  "https://d1yei2z3i6k35z.cloudfront.net/1872133/6816903c4cd08_VIV_NETworks-removebg-preview.png",
];

export function LogoSlider() {
  return (
    <section className="relative z-10 py-8">
      {/* Title */}
      <div className="text-center mb-4">
        <p className="text-zinc-400 text-sm tracking-wider uppercase">
          ✨ Ils font confiance à Publication-Web ✨
        </p>
      </div>

      {/* Slider */}
      <div 
        className="overflow-hidden relative"
        style={{
          background: "linear-gradient(90deg, #1a1a2e, #2B0F3A, #1a1a2e)",
          boxShadow: "0 0 25px rgba(139, 92, 246, 0.2)",
        }}
      >
        <div 
          className="inline-block whitespace-nowrap"
          style={{
            animation: "scroll-logo 25s linear infinite",
          }}
        >
          {/* First set */}
          {logos.map((logo, i) => (
            <img
              key={`first-${i}`}
              src={logo}
              alt={`Partner logo ${i + 1}`}
              className="inline-block h-12 mx-8 transition-all duration-300 hover:scale-110"
              style={{
                filter: "brightness(0) invert(1) drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))",
                opacity: 0.8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1) invert(1) drop-shadow(0 0 15px #a855f7)";
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(0) invert(1) drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))";
                e.currentTarget.style.opacity = "0.8";
              }}
            />
          ))}
          {/* Duplicate for seamless loop */}
          {logos.map((logo, i) => (
            <img
              key={`second-${i}`}
              src={logo}
              alt={`Partner logo ${i + 1}`}
              className="inline-block h-12 mx-8 transition-all duration-300 hover:scale-110"
              style={{
                filter: "brightness(0) invert(1) drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))",
                opacity: 0.8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1) invert(1) drop-shadow(0 0 15px #a855f7)";
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(0) invert(1) drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))";
                e.currentTarget.style.opacity = "0.8";
              }}
            />
          ))}
        </div>

        {/* Gradient overlays for smooth edges */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, #1a1a2e, transparent)",
          }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, #1a1a2e)",
          }}
        />
      </div>

      {/* scroll-logo animation defined in globals.css */}
    </section>
  );
}
