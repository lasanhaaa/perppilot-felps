"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { COURSES, courseStats } from "@/lib/course";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowRight, Button, EmptyState, StatusTag } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";

export default function CoursePage() {
  return (
    <Suspense>
      <LessonPlayer />
    </Suspense>
  );
}

const secs = (d: string) => {
  const [m, s] = d.split(":").map(Number);
  return m * 60 + s;
};
const clock = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Course page as a lesson player (2114:8145): video, short info, Course content panel. */
function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { state, set } = useStore();
  const course = COURSES.find((c) => c.id === id);
  const watched = state.watchedLessons;
  const all = course ? course.modules.flatMap((m) => m.lessons) : [];
  const lessonId = params.get("lesson") ?? (course ? courseStats(course, watched).next.id : "");
  const index = Math.max(0, all.findIndex((l) => l.id === lessonId));
  const lesson = all[index];
  const moduleIndex = course ? course.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson?.id)) : -1;
  const [open, setOpen] = useState<string[]>(course && moduleIndex >= 0 ? [course.modules[moduleIndex].id] : []);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = lesson ? secs(lesson.duration) : 1;

  const markWatched = (lid: string) => set((s) => ({ watchedLessons: s.watchedLessons.includes(lid) ? s.watchedLessons : [...s.watchedLessons, lid] }));

  useEffect(() => {
    // New lesson: start from 0 (a watched lesson shows as finished).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(0);
    setPlaying(false);
    if (course && moduleIndex >= 0) setOpen((o) => (o.includes(course.modules[moduleIndex].id) ? o : [...o, course.modules[moduleIndex].id]));
  }, [lesson?.id, course, moduleIndex]);

  useEffect(() => {
    if (!playing || !lesson) return;
    // The prototype plays a lesson 10x faster than real time.
    timer.current = setInterval(() => {
      setTime((t) => {
        const next = t + 1;
        if (next >= total) {
          setPlaying(false);
          markWatched(lesson.id);
          return total;
        }
        return next;
      });
    }, 100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, lesson?.id, total]);

  if (!course || !lesson)
    return (
      <div className="p-14">
        <EmptyState icon="book" title="Course not found" description="Pick a course from the list." action={<Button href="/course">All courses</Button>} />
      </div>
    );

  const stats = courseStats(course, watched);
  const go = (i: number) => router.push(`/course/${course.id}?lesson=${all[i].id}`);
  const isWatched = watched.includes(lesson.id);
  const progress = playing || time > 0 ? time / total : isWatched ? 1 : 0;
  const mod = course.modules[moduleIndex];

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader back="/course" className="min-h-[101px]" title={course.title} description={`${course.modules.length} modules · ${stats.lessons} lessons · ${stats.minutes} min · Free`} />
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-6 py-8 pr-10 pl-14">
          <div className="group relative aspect-[1139/641] w-full overflow-hidden bg-[#666666]">
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              {!playing && (
                <button
                  type="button"
                  aria-label="Play"
                  onClick={() => {
                    if (time >= total) setTime(0);
                    setPlaying(true);
                  }}
                  className="flex size-16 items-center justify-center rounded-full bg-brand text-black transition-transform hover:scale-105"
                >
                  <Icon name="play-solid" size={28} />
                </button>
              )}
              {playing && <span className="t-h24 max-w-[70%] text-white/80">{lesson.title}</span>}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-6 pb-4">
              <div
                className="relative h-1 cursor-pointer bg-white/20"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTime(Math.round(((e.clientX - r.left) / r.width) * total));
                }}
              >
                <span className="absolute inset-y-0 left-0 bg-white" style={{ width: `${progress * 100}%` }} />
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: `${progress * 100}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
                  <Icon name={playing ? "square" : "play"} size={24} />
                </button>
                <span className="t-b14 tnum">
                  {clock(progress * total)} / {lesson.duration}
                </span>
                <span className="flex-1" />
                <span className="t-b14">1x</span>
                <Icon name="maximize" size={24} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-8">
              <div className="flex flex-1 flex-col gap-2">
                <h2 className="t-h24">{lesson.title}</h2>
                <p className="t-b16 text-white/60">{lesson.subtitle}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" disabled={index === 0} onClick={() => go(index - 1)}>
                  Previous
                </Button>
                {index < all.length - 1 ? (
                  <Button
                    iconRight={<ArrowRight />}
                    onClick={() => {
                      markWatched(lesson.id);
                      go(index + 1);
                    }}
                  >
                    Next lesson
                  </Button>
                ) : (
                  <Button
                    iconRight={<ArrowRight />}
                    onClick={() => {
                      markWatched(lesson.id);
                      router.push("/course");
                    }}
                  >
                    Finish course
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusTag tone={isWatched ? "success" : "warning"}>{isWatched ? "Watched" : "In progress"}</StatusTag>
              <span className="t-b14 text-white/60">
                {lesson.duration} · Lesson {mod.lessons.findIndex((l) => l.id === lesson.id) + 1} of {mod.lessons.length} · Module {String(moduleIndex + 1).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <aside className="w-[420px] flex-none self-stretch border-l border-line bg-screen">
          {course.modules.map((m, mi) => {
            const done = m.lessons.filter((l) => watched.includes(l.id)).length;
            const st = done === m.lessons.length ? "completed" : done > 0 || m.id === mod.id ? "in-progress" : "none";
            const expanded = open.includes(m.id);
            return (
              <div key={m.id} className={cn(expanded && "bg-white/3")}>
                <button
                  type="button"
                  onClick={() => setOpen((o) => (o.includes(m.id) ? o.filter((x) => x !== m.id) : [...o, m.id]))}
                  className="flex min-h-[95px] w-full items-center gap-[18px] border-b border-line p-6 text-left hover:bg-white/[0.02]"
                >
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="t-l12 text-white/60">
                        Module {String(mi + 1).padStart(2, "0")} · {done} / {m.lessons.length} · {m.minutes} min
                      </span>
                      {st === "completed" && <span className="t-l12 text-success">Completed</span>}
                      {st === "in-progress" && <span className="t-l12 text-warning">In progress</span>}
                    </span>
                    <span className="t-b16">{m.title}</span>
                  </span>
                  <Icon name={expanded ? "chevron-up" : "chevron-down"} size={24} className="text-white/60" />
                </button>
                {expanded && (
                  <div className="border-b border-line">
                    {m.lessons.map((l, li) => {
                      const isNow = l.id === lesson.id;
                      const w = watched.includes(l.id);
                      return (
                        <Link
                          key={l.id}
                          href={`/course/${course.id}?lesson=${l.id}`}
                          className={cn("flex h-[95px] items-center gap-3 px-6 py-4 transition-colors", isNow ? "bg-white/8" : "hover:bg-white/[0.04]")}
                        >
                          <span className="relative h-[63px] w-[112px] flex-none overflow-hidden">
                            <Image src="/img/course/lesson-thumb.png" alt="" fill sizes="112px" className="object-cover" />
                            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
                              <span className="block h-full bg-white" style={{ width: w ? "100%" : isNow ? `${Math.max(progress, 0.08) * 100}%` : "0%" }} />
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="t-b14 truncate">{l.title}</span>
                            <span className="flex gap-2">
                              <span className="t-l12 text-white/60">
                                Lesson {li + 1} · {l.duration}
                              </span>
                              {isNow ? (
                                <span className="t-l12 text-warning">Now playing</span>
                              ) : (
                                w && <span className="t-l12 text-success">Watched</span>
                              )}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
