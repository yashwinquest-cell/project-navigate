const isGithubPages = process.env.GITHUB_PAGES === "true";
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
};

module.exports = nextConfig;
