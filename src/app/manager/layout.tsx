import { redirect } from "next/navigation";
import { getCurrentUserFromServer } from "@/lib/server-session";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserFromServer();

  if (!user) {
    redirect("/login?next=/manager/overview");
  }

  if (user.role !== "manager") {
    redirect("/");
  }

  return children;
}
