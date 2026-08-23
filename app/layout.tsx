import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "Pulse — Transport & Payments Analytics",
  description:
    "A real-time analytics dashboard for an intercity transport operator: revenue, bookings, refunds and payment-provider mix, with hand-built accessible charts.",
};

// Set the initial theme before paint to avoid a flash of the wrong colors.
const themeScript = `(function(){try{var t=localStorage.getItem("pulse-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
