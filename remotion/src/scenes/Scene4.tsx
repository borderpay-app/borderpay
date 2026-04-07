import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const steps = [
  { emoji: "🇬🇧", label: "UK Business", sub: "Sends GBP" },
  { emoji: "⬡", label: "On-Ramp", sub: "GBP → BDRP" },
  { emoji: "⚡", label: "Settlement", sub: "< 30 seconds" },
  { emoji: "⬡", label: "Off-Ramp", sub: "BDRP → EUR" },
  { emoji: "🇮🇪", label: "Irish Business", sub: "Receives EUR" },
];

export const Scene4HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: headingOpacity, marginBottom: 80 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(150, 60%, 55%)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          HOW IT WORKS
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "hsl(40, 20%, 96%)" }}>
          The payment flow
        </div>
      </div>

      {/* Flow diagram */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((step, i) => {
          const delay = 20 + i * 18;
          const stepOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const stepScale = spring({ frame: frame - delay, fps, config: { damping: 12 } });

          // Arrow between steps
          const arrowDelay = delay + 10;
          const arrowWidth = interpolate(frame, [arrowDelay, arrowDelay + 12], [0, 60], { extrapolateRight: "clamp" });

          return (
            <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  opacity: stepOpacity,
                  transform: `scale(${stepScale})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 160,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: i === 2 ? "hsla(150, 60%, 55%, 0.2)" : "hsla(0, 0%, 100%, 0.08)",
                    border: `2px solid ${i === 2 ? "hsl(150, 60%, 55%)" : "hsla(0, 0%, 100%, 0.15)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                  }}
                >
                  {step.emoji}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "hsl(40, 20%, 96%)", marginTop: 16 }}>{step.label}</div>
                <div style={{ fontSize: 13, color: "hsla(40, 20%, 96%, 0.5)", fontFamily: monoFamily, marginTop: 4 }}>{step.sub}</div>
              </div>
              {i < 4 && (
                <div
                  style={{
                    width: arrowWidth,
                    height: 2,
                    background: "linear-gradient(90deg, hsl(150, 60%, 55%), hsla(150, 60%, 55%, 0.3))",
                    marginLeft: -10,
                    marginRight: -10,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 60, marginTop: 80 }}>
        {[
          { stat: "< 30 sec", label: "Settlement" },
          { stat: "< 0.5%", label: "All-in fee" },
          { stat: "Solana", label: "Blockchain" },
          { stat: "FCA / MiCA", label: "Compliance" },
        ].map((s, i) => {
          const delay = 80 + i * 12;
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={s.label} style={{ textAlign: "center", opacity }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: monoFamily, color: "hsl(150, 60%, 55%)" }}>{s.stat}</div>
              <div style={{ fontSize: 13, color: "hsla(40, 20%, 96%, 0.5)", marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
