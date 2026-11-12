import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Giftea",
    short_name: "Giftea",
    description: "Get to know your people a little better, and always know what to gift them.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFE3EA",
    theme_color: "#FFE3EA",
    icons: [
      { src: "/brand/png/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/png/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/png/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
