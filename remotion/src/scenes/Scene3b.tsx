import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const comparisons = [
  {
    label: "Settlement Speed",
    fiat: "2–5 business days",
    stable: "< 30 seconds",
    fiatColor: "hsl(0, 70%, 60%)",
    stableColor: "hsl(150, 60%, 55%)",
  },
  {
    label: "FX & Transfer Fees",
    fiat: "3–6% spread + fees",
    stable: "< 0.5% all-in",
    fiatColor: "hsl(0, 70%, 60%)",
    stableColor: "hsl(150, 60%, 55%)",
  },
  {
    label: "Availability",
    fiat: "Banking hours only",
    stable: "24/7/365",
    fiatColor: "hsl(0, 70%, 60%)",
    stableColor: "hsl(150, 60%, 55%)",
  },
  {
    label: "Transparency",
    fiat: "Hidden markups",
    stable: "On-chain, auditable",
    fiatColor: "hsl(0, 70%, 60%)",
    stableColor: "hsl(150, 60%, 55%)",
  },
  {
    label: "Volatility Risk",
    fiat: "FX exposure in transit",
    stable: "Pegged 1:1 — zero drift",
    fiatColor: "hsl(0, 70%, 60%)",
    stableColor: "hsl(150, 60%, 55%)",
  },
];

export const Scene3bStablecoinBenefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [40, 0]);

  // Animated highlight bar that sweeps across the stablecoin column
  const highlightProgress = interpolate(frame, [60, 140], [0, 1], { extrapolateRight: "clamp" });
  const highlightHeight = highlightProgress * 100;

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Heading */}
      <div style={{ textAlign: "center", opacity: headingOpacity, transform: `translateY(${headingY}px)`, marginBottom: 60 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(150, 60%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          WHY STABLECOINS?
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.15 }}>
          BDRP vs <span style={{ color: "hsla(40, 20%, 96%, 0.4)" }}>traditional GBP / EUR</span>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ width: 1200, position: "relative" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 0, marginBottom: 16, paddingLeft: 0 }}>
          <div />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "hsla(40, 20%, 96%, 0.4)",
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              Traditional (GBP / EUR)
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "hsl(150, 60%, 55%)",
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              BDRP (BorderPay)
            </div>
          </div>
        </div>

        {/* Rows */}
        {comparisons.map((c, i) => {
          const delay = 25 + i * 16;
          const rowOpacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          const rowX = interpolate(spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 200 } }), [0, 1], [-40, 0]);

          // Stablecoin value pops in slightly after the row
          const stableDelay = delay + 8;
          const stableScale = spring({ frame: frame - stableDelay, fps, config: { damping: 12 } });

          // Checkmark appears
          const checkOpacity = interpolate(frame, [stableDelay + 5, stableDelay + 12], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div
              key={c.label}
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr 1fr",
                gap: 0,
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
                marginBottom: 8,
              }}
            >
              {/* Label */}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "hsl(40, 20%, 96%)",
                  display: "flex",
                  alignItems: "center",
                  height: 64,
                  paddingLeft: 20,
                }}
              >
                {c.label}
              </div>

              {/* Fiat value */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 64,
                  background: "hsla(0, 70%, 40%, 0.08)",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <span style={{ fontSize: 17, fontFamily: monoFamily, color: c.fiatColor, fontWeight: 500 }}>
                  ✕ {c.fiat}
                </span>
              </div>

              {/* Stablecoin value */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 64,
                  background: "hsla(150, 50%, 40%, 0.1)",
                  border: "1px solid hsla(150, 50%, 50%, 0.2)",
                  borderRadius: 12,
                  marginLeft: 6,
                  transform: `scale(${0.95 + stableScale * 0.05})`,
                }}
              >
                <span style={{ opacity: checkOpacity, marginRight: 8, fontSize: 18, color: c.stableColor }}>✓</span>
                <span style={{ fontSize: 17, fontFamily: monoFamily, color: c.stableColor, fontWeight: 500 }}>
                  {c.stable}
                </span>
              </div>
            </div>
          );
        })}

        {/* Bottom tagline */}
        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            opacity: interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" }),
            fontSize: 20,
            color: "hsla(40, 20%, 96%, 0.6)",
            fontWeight: 400,
          }}
        >
          Same value. Same peg. <span style={{ color: "hsl(150, 60%, 55%)", fontWeight: 600 }}>Faster, cheaper, always-on.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
