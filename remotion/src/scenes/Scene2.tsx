import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const problems = [
  {
    icon: "💸",
    title: "Still Expensive",
    stat: "1–3%",
    label: "Wise/Revolut markup",
    why: "They convert GBP → EUR through banking partners — each hop adds a spread.",
  },
  {
    icon: "⏳",
    title: "Not Instant",
    stat: "1–2 days",
    label: "business settlement",
    why: "Funds still move via SWIFT or SEPA — Revolut & Wise queue through intermediary banks.",
  },
  {
    icon: "🔀",
    title: "No Dual-Currency Option",
    stat: "2 wallets",
    label: "needed",
    why: "You hold GBP or EUR — never both in one instrument. Every payment triggers an FX conversion.",
  },
  {
    icon: "🚧",
    title: "Not Built for NI",
    stat: "0",
    label: "border-specific products",
    why: "Generic global platforms with no features for the unique NI–Ireland dual-jurisdiction corridor.",
  },
];

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: 80 }}>
      <div style={{ opacity: headingOpacity, transform: `translateY(${headingY}px)` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(0, 70%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          THE PROBLEM
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.15, maxWidth: 900 }}>
          Revolut, Wise & Stripe are <span style={{ color: "hsl(0, 70%, 60%)" }}>not enough</span>
        </div>
        <div style={{ fontSize: 18, color: "hsla(40, 20%, 96%, 0.45)", marginTop: 10, maxWidth: 700 }}>
          They improved consumer transfers — but still rely on the same slow, expensive banking rails underneath.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 45 }}>
        {problems.map((p, i) => {
          const delay = 30 + i * 18;
          const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const cardX = interpolate(spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 200 } }), [0, 1], [i % 2 === 0 ? -60 : 60, 0]);
          const cardScale = interpolate(spring({ frame: frame - delay, fps, config: { damping: 15 } }), [0, 1], [0.9, 1]);

          // "Why" line fades in after the card
          const whyDelay = delay + 20;
          const whyOpacity = interpolate(frame, [whyDelay, whyDelay + 15], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div
              key={p.title}
              style={{
                opacity: cardOpacity,
                transform: `translateX(${cardX}px) scale(${cardScale})`,
                background: "hsla(0, 0%, 100%, 0.05)",
                border: "1px solid hsla(0, 0%, 100%, 0.1)",
                borderRadius: 16,
                padding: "24px 28px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(40, 20%, 96%)", marginBottom: 6 }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, fontFamily: monoFamily, color: "hsl(0, 70%, 60%)" }}>{p.stat}</span>
                  <span style={{ fontSize: 13, color: "hsla(40, 20%, 96%, 0.5)" }}>{p.label}</span>
                </div>
                {/* WHY explanation */}
                <div
                  style={{
                    opacity: whyOpacity,
                    fontSize: 13,
                    color: "hsla(40, 20%, 96%, 0.5)",
                    lineHeight: 1.5,
                    borderTop: "1px solid hsla(0, 0%, 100%, 0.08)",
                    paddingTop: 8,
                    fontStyle: "italic",
                  }}
                >
                  {p.why}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
