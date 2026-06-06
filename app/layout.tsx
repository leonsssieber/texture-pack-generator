import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Texture Pack Generator — Free Minecraft Resource Pack Maker",
  description:
    "Free, browser-based Minecraft texture pack maker. Pixel editor, batch editor, animations, GIF import, skins, 3D preview, sounds — export to Java & Bedrock. All premium features unlocked.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
