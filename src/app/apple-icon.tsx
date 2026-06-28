import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C1A2E",
          borderRadius: 36,
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          TZ
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 24,
            right: 24,
            height: 6,
            background: "#FFFFFF",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 24,
            right: 24,
            height: 18,
            background: "#C8102E",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
