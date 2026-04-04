import type { Metadata } from "next"

const fallbackUrl = process.env.FALLBACK_URL || "https://localhost:3000"

export const siteConfig = {
  name: "DocuGen AI",
  shortName: "DocuGen",
  description:
    "Generate README profesional dari repository GitHub secara otomatis dengan bantuan AI.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || fallbackUrl,
  locale: "id_ID",
  keywords: [
    "README generator",
    "AI README",
    "GitHub README",
    "documentation automation",
    "Next.js",
  ],
  ogImage: "/og-default.png",
  creator: "Bagas Tsiqoh Fiqyan Uwaidha",
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | AI README Generator`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} | AI README Generator`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Open Graph Image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | AI README Generator`,
    description: siteConfig.description,
    creator: `@${siteConfig.creator}`,
    images: [siteConfig.ogImage],
  },
}

export const organizationJsonLd = {
  "@context": "https://bagasuwaidha.my.id",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
}

export const webSiteJsonLd = {
  "@context": "https://bagasuwaidha.my.id",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: "id",
}
