import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const Scene1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(spring({ frame, fps, config: { damping: 20, stiffness: 180 } }), [0, 1], [80, 0]);
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(spring({ frame: frame - 20, fps, config: { damping: 25 } }), [0, 1], [40, 0]);

  const badgeScale = spring({ frame: frame - 50, fps, config: { damping: 12 } });
  const badgeOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });

  const lineWidth = interpolate(frame, [10, 60], [0, 600], { extrapolateRight: "clamp" });

  // Gentle floating for the entire scene
  const floatY = Math.sin(frame * 0.03) * 3;

  return (
    <AbsoluteFill style={{ fontFamily, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", transform: `translateY(${floatY}px)` }}>
        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: "linear-gradient(90deg, transparent, hsl(150, 50%, 50%), transparent)",
            margin: "0 auto 40px",
            borderRadius: 2,
          }}
        />

        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "hsl(40, 20%, 96%)",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Cross-border payments,
          <br />
          <span style={{ color: "hsl(150, 60%, 55%)" }}>simplified.</span>
        </div>

        <div
          style={{
            fontSize: 26,
            color: "hsla(40, 20%, 96%, 0.7)",
            marginTop: 30,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            fontWeight: 400,
            maxWidth: 700,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.5,
          }}
        >
          Stablecoin-powered settlement for businesses
          <br />trading across Northern Ireland and Ireland
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: 50,
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "hsla(40, 80%, 50%, 0.15)",
            border: "1px solid hsla(40, 80%, 50%, 0.3)",
            borderRadius: 30,
            padding: "10px 24px",
            fontSize: 15,
            color: "hsl(40, 80%, 65%)",
            fontWeight: 500,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(40, 80%, 55%)" }} />
          Pre-launch — Register your interest
        </div>
      </div>
    </AbsoluteFill>
  );
};
