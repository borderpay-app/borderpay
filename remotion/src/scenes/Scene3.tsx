import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const features = [
  { icon: "⚡", title: "Instant Settlement", desc: "Built on Solana — under 30 seconds" },
  { icon: "🛡️", title: "Regulation-Ready", desc: "FCA & MiCA compliant by design" },
  { icon: "🇬🇧🇮🇪", title: "Built for the Border", desc: "Purpose-built for the NI–Ireland corridor" },
];

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const headingScale = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: headingOpacity, transform: `scale(${0.9 + headingScale * 0.1})` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(150, 60%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          THE SOLUTION
        </div>
        <div style={{ fontSize: 52, fontWeight: 700, color: "hsl(40, 20%, 96%)", lineHeight: 1.15 }}>
          BDRP — the dual-pegged
          <br /><span style={{ color: "hsl(150, 60%, 55%)" }}>stablecoin</span>
        </div>
        <div style={{ fontSize: 22, color: "hsla(40, 20%, 96%, 0.6)", marginTop: 16, maxWidth: 600 }}>
          Backed by a basket of EUR and GBP. 1 BDRP = 50% Euro + 50% British Pound — reducing FX volatility across both currencies.
        </div>
      </div>

      <div style={{ display: "flex", gap: 30, marginTop: 70 }}>
        {features.map((f, i) => {
          const delay = 30 + i * 20;
          const cardOpacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const cardY = interpolate(spring({ frame: frame - delay, fps, config: { damping: 15 } }), [0, 1], [60, 0]);

          return (
            <div
              key={f.title}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                background: "hsla(150, 30%, 20%, 0.3)",
                border: "1px solid hsla(150, 40%, 40%, 0.2)",
                borderRadius: 20,
                padding: "40px 36px",
                width: 320,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "hsl(40, 20%, 96%)", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 16, color: "hsla(40, 20%, 96%, 0.6)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
