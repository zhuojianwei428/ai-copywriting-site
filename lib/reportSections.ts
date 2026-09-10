/**
 * 报告章节标题的**单一正典**。
 *
 * 两个消费方：
 *  1. 服务端 `app/api/generate/route.ts` —— 把模型输出的块标记（`[[OVERVIEW]]` 等）
 *     替换成这里的带编号标题，再流给前端；
 *  2. 前端 `lib/reportProgress.ts` —— 用**同样的字符串**在累积文本里检测"第几章开始了"，
 *     驱动生成过程中的分段进度。
 *
 * ⚠️ 为什么必须放在同一个模块里：这两个用途是字符串层面的强耦合 ——
 * 服务端把标题改了、前端没跟上，分段进度会**静默退化**成字符估算：
 * 不报错、不崩溃、不空白，只是用户再也看不到分段了。这类静默漂移只能靠单一正典防住。
 * （同源教训：免责声明曾在全站存在 3 份副本，改一处就会漂移。）
 */
export const SECTION_TITLE = {
  overview: "1. Basic Overview",
  conducted: "2. How This Evaluation Was Conducted",
  framework: "3. Evaluation Framework",
  goals: "4. Progress Against Goals",
  challenges: "5. Challenges & Analysis of Causes",
  conclusion: "6. Conclusion & Recommendations",
  notes: "7. Other Notes",
} as const;
