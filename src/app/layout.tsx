import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { NotificationProvider } from "@/contexts/notification-context";
import { NotificationContainer } from "@/components/ui/notification-container";
import { ToastProvider } from "@/components/ui/toast-context";
import { Toaster } from "@/components/ui/toaster";
import { TopLoadingBar } from "@/components/ui/top-loading-bar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mobile Shop Management System",
  description: "Comprehensive mobile phone retail shop management system for Pakistan",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <TopLoadingBar />
              </Suspense>
              {children}
              <NotificationContainer />
              <Toaster />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
