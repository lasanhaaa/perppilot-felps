"use client";

import Image from "next/image";
import { useStore } from "@/lib/store";
import { COURSES, courseStats } from "@/lib/course";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, StatusTag } from "@/components/ui/primitives";

/** Courses list (2102:8803). */
export default function CoursesPage() {
  const { state } = useStore();
  const stats = COURSES.map((c) => courseStats(c, state.watchedLessons));
  const inProgress = stats.filter((s) => s.status === "in-progress").length;
  return (
    <>
      <PageHeader border={false} className="min-h-[101px]" title="Courses" description="Free video courses on how PerpPilot works. Watch them at your own pace." />
      <div className="flex flex-col gap-6 px-14 pt-8 pb-16">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="text-[20px] leading-[26px] font-medium">All courses</span>
            <span className="t-l12 text-white/30">{COURSES.length} courses · Free</span>
          </span>
          <span className="t-l12 text-white/60">
            {inProgress} of {COURSES.length} in progress
          </span>
        </div>
        <div className="flex gap-6">
          {COURSES.map((c, i) => {
            const s = stats[i];
            const started = s.status !== "not-started";
            return (
              <article key={c.id} className="flex w-[498px] flex-col overflow-hidden rounded-sm border border-line bg-card">
                <div className="relative h-[352px] w-full">
                  <Image src={c.cover} alt="" fill sizes="498px" className="object-cover" priority={i === 0} />
                </div>
                <div className="flex flex-col gap-6 p-8">
                  <StatusTag tone={s.status === "completed" ? "success" : s.status === "in-progress" ? "warning" : "neutral"} className="self-start">
                    {s.status === "completed" ? "Completed" : s.status === "in-progress" ? "In progress" : "Not started"}
                  </StatusTag>
                  <div className="flex flex-col gap-3">
                    <h2 className="t-h24">{c.title}</h2>
                    <p className="t-b14 text-white/60">{c.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="flex items-center justify-between">
                      <span className="t-l12 text-white/90">Course progress</span>
                      <span className="t-b14 text-white/60">
                        {s.modulesDone} / {c.modules.length} watched
                      </span>
                    </span>
                    <span className="h-1 bg-white/10">
                      <span className="block h-full bg-white transition-all" style={{ width: `${(s.done / s.lessons) * 100}%` }} />
                    </span>
                  </div>
                  <Button variant={started ? "primary" : "secondary"} href={`/course/${c.id}`} iconRight={<ArrowRight />}>
                    {s.status === "completed" ? "Watch again" : started ? "Continue course" : "Start course"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
