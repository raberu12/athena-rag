import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthenticatedApp } from "@/components/authenticated-app";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      <AuthenticatedApp userEmail={user.email || ""} />
    </main>
  );
}

