import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const comparisons = [
  {
    label: "Settlement Speed",
    competitor: "1–2 business days",
    stable: "< 30 seconds",
    how: "On-chain finality — no SWIFT, no clearing house, no correspondent banks",
  },
  {
    label: "Cross-Border Fees",
    competitor: "1–3% spread + fees",
    stable: "< 0.5% all-in",
    how: "No FX conversion needed — BDRP already holds both GBP and EUR value",
  },
  {
    label: "Dual-Currency Peg",
    competitor: "Not available",
    stable: "Built-in GBP+EUR peg",
    how: "50% EUR + 50% GBP in one token — send to either jurisdiction, zero drift",
  },
  {
    label: "NI–Ireland Focus",
    competitor: "Generic global product",
    stable: "Purpose-built for the border",
    how: "Designed for 20,000–40,000 cross-border NI businesses and the Windsor Framework",
  },
  {
    label: "Transparency",
    competitor: "Closed-ledger",
    stable: "On-chain, auditable",
    how: "Every transaction verifiable on Solana — reserves audited in real-time",
  },
];

export const Scene3bStablecoinBenefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [40, 0]);

  // "How it's possible" banner
  const bannerOpacity = interpolate(frame, [140, 160], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Heading */}
      <div style={{ textAlign: "center", opacity: headingOpacity, transform: `translateY(${headingY}px)`, marginBottom: 50 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(150, 60%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          WHY BDRP IS FASTER & CHEAPER
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.15 }}>
          BDRP vs <span style={{ color: "hsla(40, 20%, 96%, 0.4)" }}>Revolut / Wise / Stripe</span>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ width: 1400, position: "relative" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 1fr", gap: 0, marginBottom: 12 }}>
          <div />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "hsla(40, 20%, 96%, 0.4)",
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              Revolut / Wise / Stripe
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
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
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "hsl(40, 80%, 55%)",
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              How
            </div>
          </div>
        </div>

        {/* Rows */}
        {comparisons.map((c, i) => {
          const delay = 25 + i * 18;
          const rowOpacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          const rowX = interpolate(spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 200 } }), [0, 1], [-40, 0]);

          const stableDelay = delay + 8;
          const stableScale = spring({ frame: frame - stableDelay, fps, config: { damping: 12 } });
          const checkOpacity = interpolate(frame, [stableDelay + 5, stableDelay + 12], [0, 1], { extrapolateRight: "clamp" });

          // "How" column fades in after the row
          const howDelay = delay + 14;
          const howOpacity = interpolate(frame, [howDelay, howDelay + 12], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div
              key={c.label}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr 1fr 1fr",
                gap: 0,
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
                marginBottom: 6,
              }}
            >
              {/* Label */}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "hsl(40, 20%, 96%)",
                  display: "flex",
                  alignItems: "center",
                  height: 56,
                  paddingLeft: 16,
                }}
              >
                {c.label}
              </div>

              {/* Competitor value */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 56,
                  background: "hsla(0, 70%, 40%, 0.08)",
                  borderRadius: 10,
                  marginRight: 4,
                }}
              >
                <span style={{ fontSize: 15, fontFamily: monoFamily, color: "hsl(0, 70%, 60%)", fontWeight: 500 }}>
                  ✕ {c.competitor}
                </span>
              </div>

              {/* BDRP value */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 56,
                  background: "hsla(150, 50%, 40%, 0.1)",
                  border: "1px solid hsla(150, 50%, 50%, 0.2)",
                  borderRadius: 10,
                  marginLeft: 4,
                  marginRight: 4,
                  transform: `scale(${0.95 + stableScale * 0.05})`,
                }}
              >
                <span style={{ opacity: checkOpacity, marginRight: 6, fontSize: 16, color: "hsl(150, 60%, 55%)" }}>✓</span>
                <span style={{ fontSize: 15, fontFamily: monoFamily, color: "hsl(150, 60%, 55%)", fontWeight: 500 }}>
                  {c.stable}
                </span>
              </div>

              {/* HOW column */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 56,
                  paddingLeft: 16,
                  opacity: howOpacity,
                }}
              >
                <span style={{ fontSize: 13, color: "hsl(40, 80%, 65%)", lineHeight: 1.4 }}>
                  {c.how}
                </span>
              </div>
            </div>
          );
        })}

        {/* Bottom tagline */}
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
            opacity: interpolate(frame, [140, 160], [0, 1], { extrapolateRight: "clamp" }),
            fontSize: 18,
            color: "hsla(40, 20%, 96%, 0.6)",
            fontWeight: 400,
          }}
        >
          They improved banking. <span style={{ color: "hsl(150, 60%, 55%)", fontWeight: 600 }}>We're replacing the rails entirely.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
