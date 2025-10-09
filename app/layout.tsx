import { Metadata } from "next";
import "./index.scss";
import { Topnav } from "@/components/topnav/topnav";
import { JSX } from "react";

export const metadata: Metadata = {
  title: "Hosico Litter Box",
  description: "Turn your shitcoin and trash into $HOSICO",
};

export default function RootLayout({ children }): JSX.Element {
  return (
    <html lang="en">
      <body>
        <Topnav />
        {children}
        <video
          className="body_bg"
          src="/hero_bg.mp4"
          muted
          autoPlay
          loop
          playsInline
        />
      </body>
    </html>
  );
}
