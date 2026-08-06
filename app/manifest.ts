import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_PATH = process.env.GITHUB_PAGES === "true" ? "/project-navigate" : "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Navigate — Indoor Wayfinding Demo",
    short_name: "Navigate",
    description: "Indoor wayfinding demo for malls and amusement parks",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#0e1a26",
    theme_color: "#e2572b",
    orientation: "portrait",
    icons: [
      {
        src: `${BASE_PATH}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
