import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const impacts = [
  {
    emoji: "🚧",
    title: "New Trade Barriers",
    desc: "Brexit created customs checks and paperwork for goods crossing between GB and Northern Ireland.",
    stat: "2021",
    statLabel: "Protocol introduced",
  },
  {
    emoji: "📝",
    title: "Regulatory Complexity",
    desc: "NI businesses now follow both UK and EU rules — the Windsor Framework tries to simplify, but FX pain remains.",
    stat: "2x",
    statLabel: "regulatory burden",
  },
  {
    emoji: "💸",
    title: "Rising FX Costs",
    desc: "More cross-border compliance means more currency conversions — and even Revolut, Wise, and Stripe charge 1–3% on business FX.",
    stat: "6.49%",
    statLabel: "avg. remittance cost",
  },
  {
    emoji: "🏭",
    title: "30,000+ Businesses Affected",
    desc: "Over thirty thousand NI businesses trade cross-border daily — from suppliers and payroll to invoices and tax.",
    stat: "30K+",
    statLabel: "daily cross-border businesses",
  },
];

export const SceneBrexit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: 80 }}>
      <div style={{ opacity: headingOpacity, transform: `translateY(${headingY}px)`, marginBottom: 50 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(0, 70%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          THE BREXIT IMPACT
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.2, maxWidth: 900 }}>
          How Brexit made cross-border
          <br />payments <span style={{ color: "hsl(0, 70%, 60%)" }}>even harder</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {impacts.map((p, i) => {
          const delay = 25 + i * 18;
          const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const cardScale = interpolate(spring({ frame: frame - delay, fps, config: { damping: 18 } }), [0, 1], [0.92, 1]);
          const cardY = interpolate(spring({ frame: frame - delay, fps, config: { damping: 20 } }), [0, 1], [30, 0]);

          return (
            <div
              key={p.title}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px) scale(${cardScale})`,
                background: "hsla(0, 0%, 100%, 0.05)",
                border: "1px solid hsla(0, 0%, 100%, 0.1)",
                borderRadius: 16,
                padding: "28px 32px",
                display: "flex",
                alignItems: "flex-start",
                gap: 18,
              }}
            >
              <div style={{ fontSize: 32, flexShrink: 0, marginTop: 2 }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 600, color: "hsl(40, 20%, 96%)", marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: "hsla(40, 20%, 96%, 0.55)", lineHeight: 1.5, marginBottom: 12 }}>{p.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, fontFamily: monoFamily, color: "hsl(0, 70%, 60%)" }}>{p.stat}</span>
                  <span style={{ fontSize: 13, color: "hsla(40, 20%, 96%, 0.4)" }}>{p.statLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
