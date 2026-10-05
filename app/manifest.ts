import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RyuExam CBT",
    short_name: "RyuExam",
    description: "Computer Based Test for school",
    start_url: "/",
    display: "standalone",
    background_color: "#e8f0fa",
    theme_color: "#2563a8",
    icons: [
      { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
    ],
  };
}
