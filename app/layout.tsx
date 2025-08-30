import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/toastProvider";



export const metadata: Metadata = {
  title: "Vinx",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className=""
      >
          <Providers>
        {children}
        </Providers>
        <ToastProvider/>
      </body>
    </html>
  );
}
