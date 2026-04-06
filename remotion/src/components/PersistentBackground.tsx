import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const hueShift = interpolate(frame, [0, 1452], [0, 30]);
  
  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, hsl(${150 + hueShift}, 38%, 12%) 0%, hsl(${214 + hueShift * 0.5}, 45%, 16%) 50%, hsl(${150 + hueShift}, 30%, 10%) 100%)`,
        }}
      />
      {/* Subtle animated circles */}
      {[0, 1, 2].map((i) => {
        const x = interpolate(frame, [0, 750], [20 + i * 25, 30 + i * 20]);
        const y = interpolate(frame, [0, 750], [15 + i * 20, 25 + i * 15]);
        const scale = interpolate(
          Math.sin((frame + i * 80) * 0.01),
          [-1, 1],
          [0.8, 1.2]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, hsla(150, 40%, 30%, 0.15) 0%, transparent 70%)`,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
