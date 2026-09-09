import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { katex } from "@mdit/plugin-katex";

const telegramSvg =
  '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.674c.459 0 .661-.21.916-.457l2.199-2.138 4.574 3.38c.843.464 1.45.225 1.66-.782l2.997-14.128c.307-1.23-.469-1.788-1.282-1.393z"/></svg>';

export default withMermaid(
  defineConfig({
    title: "UB Society | United Blockchain Society",
    titleTemplate: ":title - UB Society",
    description:
      "United Blockchain Society - Open Web3 and blockchain education. Structured learning modules covering blockchain fundamentals, smart contract development, and decentralized systems.",
    cleanUrls: true,
    markdown: {
      config: (md) => {
        md.use(katex as any);
      },
    },
    sitemap: {
      hostname: "https://ubsc.my.id",
      transformItems: (items) =>
        items.filter((item) => !item.url.includes("archive")),
    },
    vite: {
      optimizeDeps: {
        include: ["mermaid", "lodash-es"],
      },
    },
    head: [
      ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      ["meta", { name: "theme-color", content: "#0b0b0b" }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:locale", content: "en_US" }],
      [
        "meta",
        {
          property: "og:title",
          content: "UB Society | United Blockchain Society",
        },
      ],
      ["meta", { property: "og:site_name", content: "UB Society" }],
      ["meta", { property: "og:url", content: "https://ubsc.my.id/" }],
      ["meta", { property: "og:image", content: "https://ubsc.my.id/og.jpg" }],
      [
        "meta",
        {
          property: "og:description",
          content:
            "Open Web3 and blockchain education. Structured learning modules covering blockchain fundamentals, smart contract development, and decentralized systems.",
        },
      ],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:site", content: "@ubsociety" }],
      [
        "meta",
        {
          name: "twitter:title",
          content: "UB Society | United Blockchain Society",
        },
      ],
      ["meta", { name: "twitter:image", content: "https://ubsc.my.id/og.jpg" }],
      [
        "meta",
        {
          name: "twitter:description",
          content:
            "Open Web3 and blockchain education. Structured learning modules covering blockchain fundamentals, smart contract development, and decentralized systems.",
        },
      ],
      [
        "script",
        {
          defer: "",
          src: "https://go.rafifmsn.com/script.js",
          "data-website-id": "18a0b460-ae90-4fee-b331-e2eaf28415cb",
        },
      ],
    ],
    themeConfig: {
      siteTitle: false,
      logo: {
        light: "/logo-light.svg",
        dark: "/logo-dark.svg",
        alt: "UB Society",
      },
      nav: [
        { text: "Home", link: "/" },
        { text: "Learn", link: "/learn/" },
        { text: "About", link: "/about" },
      ],
      sidebar: {
        "/archive/": [
          {
            text: "Archive & Sandbox",
            items: [{ text: "Testing Suite", link: "/archive/" }],
          },
        ],
        "/learn/fundamentals/": [
          {
            text: "Blockchain Fundamentals",
            items: [{ text: "Track Overview", link: "/learn/fundamentals/" }],
          },
        ],
        "/learn/builder/": [
          {
            text: "Builder Track",
            items: [{ text: "Track Overview", link: "/learn/builder/" }],
          },
        ],
        "/learn/": [
          {
            text: "Curriculum",
            items: [{ text: "All Tracks", link: "/learn/" }],
          },
        ],
      },
      search: {
        provider: "local",
      },
      socialLinks: [
        { icon: "github", link: "https://github.com/ub-society" },
        { icon: "discord", link: "https://discord.gg/qnNnEDc4aF" },
        { icon: { svg: telegramSvg }, link: "https://t.me/+O-KOI0O-d0FhNDQ1" },
      ],
      footer: {
        message:
          '<a href="https://discord.gg/qnNnEDc4aF" target="_blank" rel="noreferrer">Discord</a> - <a href="https://t.me/+O-KOI0O-d0FhNDQ1" target="_blank" rel="noreferrer">Telegram</a> - <a href="https://x.com/ubsociety" target="_blank" rel="noreferrer">X</a> - <a href="https://instagram.com/ubsociety_hq" target="_blank" rel="noreferrer">Instagram</a> - <a href="https://www.linkedin.com/company/ub-society" target="_blank" rel="noreferrer">LinkedIn</a>',
        copyright: "Copyright © 2026 UB Society",
      },
    },
  }),
);
