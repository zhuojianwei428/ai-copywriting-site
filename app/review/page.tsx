import type { Metadata } from "next";
import { AuthProvider } from "../../components/auth/AuthContext";
import ReviewEditor from "../../components/ReviewEditor";

/**
 * 结果编辑页：生成完成后跳到这里。
 * 用户可以在页面上直接改文字 / 补 justification，再从这页导出 PDF / Word。
 * 内容是用户私有草稿，不参与索引。
 */
export const metadata: Metadata = {
  title: "Edit your review — AI Review Writer",
  description:
    "Polish your AI-generated performance review before exporting it to PDF or Word.",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <AuthProvider>
      <ReviewEditor />
    </AuthProvider>
  );
}
