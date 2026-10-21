import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sarafa Books",
  description: "Double-entry accounting for jewellery and trading businesses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        {process.env.NODE_ENV !== "production" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){function strip(el){if(!el||el.nodeType!==1)return;el.removeAttribute("data-cursor-ref");el.removeAttribute("data-cursor-element-id");if(el.querySelectorAll){el.querySelectorAll("[data-cursor-ref],[data-cursor-element-id]").forEach(function(n){n.removeAttribute("data-cursor-ref");n.removeAttribute("data-cursor-element-id")})}}strip(document.documentElement);var mo=new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==="attributes"&&m.target&&m.target.removeAttribute){if(m.attributeName==="data-cursor-ref")m.target.removeAttribute("data-cursor-ref");if(m.attributeName==="data-cursor-element-id")m.target.removeAttribute("data-cursor-element-id")}if(m.addedNodes){for(var j=0;j<m.addedNodes.length;j++)strip(m.addedNodes[j])}}});mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["data-cursor-ref","data-cursor-element-id"]});setTimeout(function(){mo.disconnect()},2500)})();`,
            }}
          />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
