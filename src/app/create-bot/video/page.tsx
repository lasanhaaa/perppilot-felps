"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { SetupShell } from "@/components/shell/setup-shell";
import { HeadingRow } from "@/components/create/ui";
import { BotTypeIcon, type BotType } from "@/components/ui/bot-type-icon";
import { ArrowRight, Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { CREATE_STEPS, useDraft } from "@/lib/draft";

/** Create bot · 1 Bot video (V3 2336:17277, PointBot 2336:17366): watch, then Continue. */
export default function BotVideoPage() {
  return (
    <Suspense>
      <BotVideo />
    </Suspense>
  );
}

const VIDEO: Record<BotType, { name: string; title: string; eyebrow: string; next: string; duration: number }> = {
  v3: { name: "Meet the V3 Bot", title: "How the V3 Bot earns", eyebrow: "V3 Bot · 2 min", next: "/create-bot/account", duration: 130 },
  point: { name: "Meet PointBot", title: "How PointBot earns", eyebrow: "PointBot · 2 min", next: "/create-bot/accounts", duration: 130 },
};

const clock = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

function BotVideo() {
  const router = useRouter();
  const params = useSearchParams();
  const { draft, ready } = useDraft();
  const type: BotType = (params.get("type") as BotType | null) ?? (ready ? draft.type : "v3");
  const v = VIDEO[type] ?? VIDEO.v3;

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = v.duration;

  useEffect(() => {
    if (!playing) return;
    // The prototype plays the video 10x faster than real time.
    timer.current = setInterval(() => {
      setTime((t) => {
        if (t + 1 >= total) {
          setPlaying(false);
          return total;
        }
        return t + 1;
      });
    }, 100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, total]);

  const progress = time / total;
  const started = playing || time > 0;

  return (
    <SetupShell steps={CREATE_STEPS} current={0} exitLabel="Exit">
      <div className="flex w-[800px] flex-col gap-10">
        <HeadingRow back="/create-bot" title={v.name} description="Watch this short video before you set it up." />

        <div className="group relative aspect-video w-full overflow-hidden border border-line bg-screen">
          <div className="absolute inset-0 bg-raised" />
          {/* Poster: bot type icon, eyebrow, title. Fades while the video plays. */}
          <div className={`absolute top-10 left-10 flex flex-col gap-4 transition-opacity duration-300 ${playing ? "opacity-0" : "opacity-100"}`}>
            <BotTypeIcon type={type} size={80} />
            <div className="flex flex-col gap-1">
              <span className="t-l12 text-white/60 uppercase">{v.eyebrow}</span>
              <span className="t-h24">{v.title}</span>
            </div>
          </div>
          {playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <BotTypeIcon type={type} size={160} className="opacity-90" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
          <div className="absolute inset-0 flex items-center justify-center">
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
              {started && <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: `${progress * 100}%` }} />}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
                <Icon name={playing ? "square" : "play"} size={24} />
              </button>
              <span className="t-b14 tnum">
                {clock(time)} / {clock(total)}
              </span>
              <span className="flex-1" />
              <span className="t-b14">1x</span>
              <Icon name="maximize" size={24} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <p className="t-b14 text-white/60">Takes 2 minutes. You can watch it again from the bot page.</p>
          <Button className="w-[200px]" iconRight={<ArrowRight />} onClick={() => router.push(v.next)}>
            Continue
          </Button>
        </div>
      </div>
    </SetupShell>
  );
}
