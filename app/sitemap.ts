import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.aiwritereview.com";
  return [
    // 注意：/review 是用户私有草稿编辑器，页面 metadata 为 index:false。
    // noindex 的网址绝不能进 sitemap（GSC 会报「已提交但标记为 noindex」），故此处不收录。
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    // 格式变体落地页：各自对准一个功能型长尾词（见桌面《页面策略》§三）。
    {
      url: `${base}/self-review-generator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/manager-review-generator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/peer-review-generator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/360-feedback-generator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
