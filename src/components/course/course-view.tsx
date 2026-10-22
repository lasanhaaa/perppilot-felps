"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { ExchangeGlyph } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { UnderlineTabs } from "@/components/ui/tabs";
import { Chip, MonoTag, StatusPill } from "@/components/ui/tag";
import { PageBody } from "@/components/shell/page-header";
import { useShell } from "@/components/shell/shell-context";
import { useI18n } from "@/lib/i18n";
import { courseModules } from "@/lib/mock-data";
import { usePlatformData } from "@/lib/platform-data";
import type { CourseModule } from "@/lib/types";

type Filter = "all" | "in-progress" | "watched";

const STATUS = {
  watched: { tone: "positive", label: "Watched", border: "border-brand" },
  "in-progress": { tone: "info", label: "In progress", border: "border-info" },
  "not-started": { tone: "neutral", label: "Not started", border: "border-white/30" },
} as const;

function ModuleCard({ module, onWatch }: { module: CourseModule; onWatch: () => void }) {
  const s = STATUS[module.status];
  return (
    <article className={cn("group relative flex flex-col overflow-hidden border-t bg-fill-2 px-6 pt-6 pb-5 transition-colors hover:bg-fill-3", s.border)}>
      <Image src="/images/course/card-texture.png" alt="" fill sizes="500px" className="pointer-events-none object-cover opacity-[0.06]" />
      <div className="relative flex flex-col gap-3">
        <StatusPill tone={s.tone} className="w-fit text-[12px]">
          {s.label}
        </StatusPill>
        <h3 className="min-h-[2.6em] font-display text-[22px] leading-[1.3] sm:text-[24px]">{module.title}</h3>
        <div className="flex items-center justify-between text-[12px] font-medium text-white/40 uppercase">
          <span className="flex items-center gap-2">
            Module {module.index}
            <Chip className="text-[12px]">
              <ExchangeGlyph id="extended" size={16} />
              Basics
            </Chip>
          </span>
          <span>[ {module.minutes} min ]</span>
        </div>
      </div>
      <div className="relative my-4 flex aspect-[437/327] items-center justify-center">
        <Image src={module.image} alt="" width={437} height={327} className="max-h-full w-auto opacity-70 transition-opacity group-hover:opacity-100" />
      </div>
      <button type="button" onClick={onWatch} className="relative flex h-12 items-center justify-center gap-2 border-t border-line text-[14px] font-semibold uppercase after:absolute after:inset-0">
        {module.status === "watched" ? "Watch again" : module.status === "in-progress" ? "Continue" : "Watch now"}
        <Icon name="arrow-forward" size={20} className="transition-transform group-hover:translate-x-1" />
      </button>
    </article>
  );
}

export function CourseView() {
  const { t } = useI18n();
  const { openPortfolioAnalysis } = useShell();
  const { markCourseStarted } = usePlatformData();
  const [filter, setFilter] = useState<Filter>("all");
  const [playing, setPlaying] = useState<CourseModule | null>(null);

  const visible = courseModules.filter((m) => filter === "all" || m.status === filter);
  const watched = courseModules.filter((m) => m.status === "watched").length;
  const inProgress = courseModules.filter((m) => m.status === "in-progress").length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="relative z-10 flex flex-col gap-5 px-4 pt-12 pb-10 sm:px-8 lg:max-w-[620px] lg:px-14 lg:pt-24 lg:pb-20">
          <span className="flex">
            <MonoTag>
              <span className="size-1.5 bg-brand" /> Live current TVL
            </MonoTag>
            <MonoTag tone="dark" className="bg-brand/15 text-brand">
              $150M
            </MonoTag>
          </span>
          <h1 className="font-display text-[32px] leading-[1.15] tracking-[-0.02em] sm:text-[40px]">{t("course.title")}</h1>
          <p className="text-[16px] leading-[1.6] text-white/60">
            Five short videos that take you from connecting your exchange account to deploying and monitoring your first bot on PerpPilot. It is free and self-paced. When you have watched them, book a call with one of our analysts to go through your setup.
          </p>
        </div>
        <Image src="/images/course-hero.png" alt="" width={706} height={418} priority className="pointer-events-none absolute top-6 right-0 hidden w-[min(706px,48vw)] mix-blend-lighten lg:block" />
        <UnderlineTabs
          className="relative z-10 px-4 sm:px-8 lg:px-14"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "All", icon: "bolt", count: courseModules.length },
            { value: "in-progress", label: "In progress", icon: "error", count: inProgress },
            { value: "watched", label: "Watched", icon: "close", count: watched },
          ]}
        />
      </section>

      <PageBody className="pt-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-4 font-display text-[22px]">
            Modules <span className="font-sans text-[12px] font-medium text-white/40 uppercase">[ Free · self-paced ]</span>
          </h2>
          <span className="text-[12px] font-medium text-white/40 uppercase">
            {watched} of {courseModules.length} watched
          </span>
        </header>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <ModuleCard key={m.id} module={m} onWatch={() => {
                setPlaying(m);
                markCourseStarted();
              }} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border border-line bg-fill-1 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-[18px]">Done with the basics?</p>
            <p className="text-[14px] text-white/60">Book a free call with an analyst and set up your first bot together.</p>
          </div>
          <Button onClick={openPortfolioAnalysis} iconRight="arrow-forward">
            Book a call
          </Button>
        </div>
      </PageBody>

      <Modal open={playing !== null} onClose={() => setPlaying(null)} accent title={playing ? `Module ${playing.index}` : ""} description={playing?.title} className="sm:w-[951px]">
        <div className="relative aspect-video w-full bg-[#2a2a2a]">
          <Image src="/images/video-poster.png" alt="" fill sizes="903px" className="object-cover" />
          <span className="absolute top-1/2 left-1/2 grid size-[61px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-black">
            <Icon name="play" size={28} />
          </span>
        </div>
      </Modal>
    </>
  );
}
