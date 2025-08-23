import "bootstrap/dist/css/bootstrap.min.css";
import { Geist, Geist_Mono, Roboto_Slab } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
  weight: ["100", "400", "700"],
  display: "swap",
});

export const metadata = {
  title: "AlphaWell",
  description: "AI-powered chatbot for customer support and first aid.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
