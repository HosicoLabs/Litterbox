import "./index.scss";
import { Topnav } from "@/components/topnav/topnav";

export const metadata = {
  title: "Hosico Litter Box",
  description: "Turn your shitcoin and trash into $HOSICO",
};

export default function RootLayout({ children }) {
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
