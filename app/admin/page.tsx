import Image from "next/image";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { AdminDashboard } from "./AdminDashboard";
import "./admin.css";
import "./instagram-admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="admin-brand"><Image src="/assets/logo-glenys.png" width={1988} height={602} alt="Dra. Glenys Nina" priority unoptimized /></Link>
        <div><span>{user.displayName}</span><a href={chatGPTSignOutPath("/")}>Cerrar sesión</a></div>
      </header>
      <AdminDashboard signedInEmail={user.email} />
    </main>
  );
}
