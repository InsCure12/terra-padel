import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { getCurrentUserFromServer } from "@/lib/server-session";

const loginImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD54MvlYQUizlfazMRFVSXIxK4evGbFhI5c92dQinrXbbgQopMSdj1C6qVAQxZ2c0d8cpI7iQ5xW4Vp4_6FuBShCd4A0Yuiyt8igNNKCSRtI1ri_ICOZ2PzT0cE3lflPgiNrBPmpqSBOWVIbRvxAUdE2qm9IqDmDu4Vtpi4heS0Mg_oyJ5776cPo2W_D4B3AYyxo4wvpge6LEunQ7PAZvgVC3hZL6vX_HHB2LsMe44r_ewFixZS1AaInOSER9YTKg8i5JSTtv32ekU";

export default async function LoginPage() {
  const user = await getCurrentUserFromServer();

  if (user?.role === "manager") {
    redirect("/manager/overview");
  }

  if (user?.role === "player") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)] text-[var(--on-surface)]">
      <main className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative hidden h-[700px] overflow-hidden rounded-xl shadow-lg lg:block">
            <img
              alt="Terra Padel Court"
              className="absolute inset-0 h-full w-full object-cover"
              src={loginImage}
            />
            <div className="absolute inset-0 bg-[var(--primary)]/20 mix-blend-multiply" />
            <div className="absolute right-12 bottom-12 left-12 text-white">
              <h2 className="mb-4 text-4xl font-bold">Rooted in Sport.</h2>
              <p className="text-lg leading-relaxed opacity-90">
                Experience the game in harmony with nature. Our courts are designed to ground your performance
                and lift your spirit.
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </main>

      <footer className="border-t border-[var(--outline-variant)]/20 p-8 text-center">
        <p className="text-xs text-[var(--outline)]/70">© 2024 Terra Padel. All rights reserved. Grounded in excellence.</p>
      </footer>
    </div>
  );
}
