import "./index.scss";
import "./globals.css";
import { Topnav } from "../components/topnav/topnav"; 
import { AppProviders } from "../components/providers/app-providers"; 

export const metadata = {
  title: "Hosico Litter Box",
  description: "Turn your shitcoin and trash into $HOSICO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>        
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
        </AppProviders>
      </body>
    </html>
  );
}
