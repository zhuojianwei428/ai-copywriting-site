import Landing from "../components/Landing";
import { AuthProvider } from "../components/auth/AuthContext";
import { webApplicationLd, faqLd } from "../lib/jsonld";

export default function Home() {
  return (
    <>
      {/* 结构化数据随页注入（此前在 layout 全局注入，会让变体页也声明首页 url） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd()) }}
      />
      <AuthProvider>
        <Landing />
      </AuthProvider>
    </>
  );
}
