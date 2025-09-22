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
      </body>
    </html>
  );
}
