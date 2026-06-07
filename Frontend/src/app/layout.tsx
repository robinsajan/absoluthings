import type { Metadata } from "next";
import { Montserrat, Bodoni_Moda } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500"],
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni-moda",
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

export const metadata: Metadata = {
  title: "ABSOLUTHINGS | Precision 3D Printing & Design",
  description: "Precision is the bridge between the digital void and physical permanence. Join the waiting list for our custom 3D printed objects and creations.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${bodoniModa.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        {children}
        {/* Floating Instagram Button for Mobile */}
        <a
          href="https://www.instagram.com/theabsoluthings/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed left-0 bottom-24 z-40 flex items-center justify-center w-12 h-12 bg-surface/90 backdrop-blur-md border-y border-r border-primary/15 text-primary hover:bg-primary hover:text-surface transition-all duration-300 md:hidden"
          aria-label="Instagram"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </a>
      </body>
    </html>
  );
}
