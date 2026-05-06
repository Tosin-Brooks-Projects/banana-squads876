import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Fredoka } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
  weight: ["400", "500", "600", "700"],
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: 'swap',
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Unboring Surveys - Transform Surveys into Fun Experiences",
  description: "Create engaging, gamified surveys that people actually want to complete. Build ice cream sundaes, grow gardens, brew coffee, and more while collecting valuable feedback.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unboring Surveys",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${fredoka.variable} font-outfit antialiased text-neutral-900 bg-neutral-50 noise-overlay`}>
        <AuthProvider>
          {/* Direct script to kill lingering service workers in development */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(var registration of registrations) {
                        registration.unregister();
                      }
                      if (registrations.length > 0) window.location.reload();
                    });
                  }
                }
              `,
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
