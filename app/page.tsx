import Landing from "../components/Landing";
import { AuthProvider } from "../components/auth/AuthContext";

export default function Home() {
  return (
    <AuthProvider>
      <Landing />
    </AuthProvider>
  );
}
