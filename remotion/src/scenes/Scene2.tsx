import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const problems = [
  { icon: "💸", title: "Still Expensive", stat: "1–3%", label: "Wise/Revolut markup on GBP↔EUR" },
  { icon: "⏳", title: "Not Instant", stat: "1–2 days", label: "Wise settlement for business" },
  { icon: "🔀", title: "No Dual-Currency Option", stat: "2", label: "separate wallets needed" },
  { icon: "🚧", title: "Not Built for NI", stat: "0", label: "products designed for the border" },
];

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: 100 }}>
      <div style={{ opacity: headingOpacity, transform: `translateY(${headingY}px)` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(0, 70%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          THE PROBLEM
        </div>
        <div style={{ fontSize: 52, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.15, maxWidth: 800 }}>
          Revolut, Wise & Stripe
          <br />are <span style={{ color: "hsl(0, 70%, 60%)" }}>not enough</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 60 }}>
        {problems.map((p, i) => {
          const delay = 30 + i * 15;
          const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const cardX = interpolate(spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 200 } }), [0, 1], [i % 2 === 0 ? -60 : 60, 0]);
          const cardScale = interpolate(spring({ frame: frame - delay, fps, config: { damping: 15 } }), [0, 1], [0.9, 1]);

          return (
            <div
              key={p.title}
              style={{
                opacity: cardOpacity,
                transform: `translateX(${cardX}px) scale(${cardScale})`,
                background: "hsla(0, 0%, 100%, 0.05)",
                border: "1px solid hsla(0, 0%, 100%, 0.1)",
                borderRadius: 16,
                padding: "28px 32px",
                display: "flex",
                alignItems: "flex-start",
                gap: 18,
              }}
            >
              <div style={{ fontSize: 32 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "hsl(40, 20%, 96%)", marginBottom: 8 }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, fontFamily: monoFamily, color: "hsl(0, 70%, 60%)" }}>{p.stat}</span>
                  <span style={{ fontSize: 14, color: "hsla(40, 20%, 96%, 0.5)" }}>{p.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
