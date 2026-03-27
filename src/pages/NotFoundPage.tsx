import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BgEffect } from "../components/ParticlesBackground";
import { Header } from "../components/Header";
import { LanguageToggle } from "../components/LanguageToggle";
import { usePageMeta } from "../hooks/usePageMeta";

export function NotFoundPage() {
  const { t } = useTranslation();

  usePageMeta({
    title: t("notFoundMetaTitle"),
    description: t("notFoundMetaDescription"),
  });

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,#133353_0%,#091320_42%,#050a13_100%)]">
      <BgEffect />
      <LanguageToggle />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 sm:px-6 lg:px-8">
        <Header />

        <main className="flex flex-1 items-center justify-center py-10">
          <section className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950/35 p-6 text-center sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              404
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {t("notFoundTitle")}
            </h1>
            <p className="mt-4 text-base text-slate-300">
              {t("notFoundDescription")}
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                to="/"
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
              >
                {t("backHome")}
              </Link>
            </div>
          </section>
        </main>

        <footer className="relative z-10 py-6 text-center text-sm text-white/70">
          {t("poweredBy")}{" "}
          <a
            href="https://github.com/FiammaMuscari"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-white"
          >
            Fiamy
          </a>
        </footer>
      </div>
    </div>
  );
}
