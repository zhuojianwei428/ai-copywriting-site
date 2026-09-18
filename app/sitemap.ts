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
      url: `${base}/self-assessment-generator`,
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
    // 内容型页面：对准「角色 + 例句」长尾词（T=0、无巨头占位的唯一例外）。
    {
      url: `${base}/software-engineer-performance-review-examples`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
