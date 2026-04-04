import type { Metadata } from "next"
import { Geist_Mono, Inter, Montserrat } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { defaultMetadata, organizationJsonLd, webSiteJsonLd } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

const montserratHeading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = defaultMetadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const year = new Date().getFullYear()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        montserratHeading.variable
      )}
    >
      <body className="min-h-svh">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        <footer className="border-t bg-background/80 px-4 py-4 text-center text-sm text-muted-foreground md:px-6">
          <p>
            Copyright (c) {year}. Visit{" "}
            <a
              href="https://bagasuwaidha.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Tsiqoh
            </a>
          </p>
        </footer>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
