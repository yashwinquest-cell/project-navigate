const isGithubPages = process.env.GITHUB_PAGES === "true";
// Capacitor bundles the static export inside the app and serves it from the
// root of a local webview server, so it needs NO basePath/assetPrefix —
// unlike the GitHub Pages build, which is served from a /project-navigate/ subpath.
const isCapacitor = process.env.CAPACITOR === "true";
const repoName = "project-navigate";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isGithubPages && {
    output: "export",
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
    images: { unoptimized: true },
  }),
  ...(isCapacitor && {
    output: "export",
    images: { unoptimized: true },
  }),
};

module.exports = nextConfig;
