/** Course content (Figma 2102:8800 / 2114:8145). Lesson ids are stored in state.watchedLessons. */

export type Lesson = { id: string; title: string; subtitle: string; duration: string };
export type Module = { id: string; title: string; minutes: number; lessons: Lesson[] };
export type Course = {
  id: string;
  title: string;
  description: string;
  cover: string;
  modules: Module[];
};

const L = (id: string, title: string, subtitle: string, duration = "02:10"): Lesson => ({ id, title, subtitle, duration });

export const COURSES: Course[] = [
  {
    id: "fundamentals",
    title: "PerpPilot Fundamentals",
    description:
      "Free, self-paced video course. Learn what PerpPilot does for you, how bots earn from movement instead of direction, and the four levers behind your results.",
    cover: "/img/course/fundamentals.png",
    modules: [
      {
        id: "m1",
        title: "Your start: what PerpPilot already does for you",
        minutes: 9,
        lessons: [
          L("f-1-1", "Welcome to PerpPilot", "What the platform does while you are away.", "03:05"),
          L("f-1-2", "Connect an exchange in 2 minutes", "Why Nado is the easiest first exchange.", "02:50"),
          L("f-1-3", "Your PIN and your keys", "How your exchange keys stay encrypted.", "03:05"),
        ],
      },
      {
        id: "m2",
        title: "Earn from movement, not direction",
        minutes: 9,
        lessons: [
          L("f-2-1", "Reading the Bot Overview", "Where every bot and its numbers live."),
          L("f-2-2", "In range, out of range and no result", "What the range means for your earnings."),
          L("f-2-3", "Net fees, APR and pool size", "The three numbers that tell you how a bot is doing."),
          L("f-2-4", "Active, Error and Stopped bots", "What each bot status means and what to do when a bot stops."),
        ],
      },
      {
        id: "m3",
        title: "Your automations: fees and points",
        minutes: 12,
        lessons: [
          L("f-3-1", "How a V3 bot places its grid", "Buys below the price, sells above.", "03:00"),
          L("f-3-2", "Strategy presets", "Conservative, Balanced or Aggressive.", "03:00"),
          L("f-3-3", "PointBots and the spread", "Earning from price gaps between exchanges.", "03:00"),
          L("f-3-4", "Points and rewards", "What you earn on top of the fees.", "03:00"),
        ],
      },
      {
        id: "m4",
        title: "The four levers that drive your results",
        minutes: 10,
        lessons: [
          L("f-4-1", "Market choice", "Why deep markets work best.", "02:30"),
          L("f-4-2", "Range width", "Tighter earns more, wider lasts longer.", "02:30"),
          L("f-4-3", "Position size", "How much to put in a first bot.", "02:30"),
          L("f-4-4", "Time", "Why patience beats tweaking.", "02:30"),
        ],
      },
      {
        id: "m5",
        title: "The team, the track record, your next step",
        minutes: 7,
        lessons: [
          L("f-5-1", "Who builds PerpPilot", "The team behind the bots.", "02:20"),
          L("f-5-2", "The track record", "How the bots did over the last year.", "02:20"),
          L("f-5-3", "Your next step", "Start your first bot today.", "02:20"),
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced Strategies",
    description:
      "For when your first bot is running. Go deeper on range width, rebalancing and running several bots across exchanges, and learn when to step in yourself.",
    cover: "/img/course/advanced.png",
    modules: [
      { id: "a1", title: "Range width in depth", minutes: 11, lessons: [L("a-1-1", "Reading volatility", "Pick a range from the market's moves.", "05:30"), L("a-1-2", "Custom ranges", "When to leave the presets.", "05:30")] },
      { id: "a2", title: "Rebalancing", minutes: 9, lessons: [L("a-2-1", "When a bot leaves its range", "Wait, re-center or stop.", "04:30"), L("a-2-2", "Changing presets", "What happens to open orders.", "04:30")] },
      { id: "a3", title: "Several bots, several exchanges", minutes: 12, lessons: [L("a-3-1", "Spreading capital", "How to split across bots.", "06:00"), L("a-3-2", "PointBots across exchanges", "Margin and leverage per account.", "06:00")] },
      { id: "a4", title: "When to step in", minutes: 8, lessons: [L("a-4-1", "Errors and low margin", "Fix the most common stops.", "04:00"), L("a-4-2", "Stopping a bot", "Close cleanly and keep your earnings.", "04:00")] },
    ],
  },
];

export function courseStats(course: Course, watched: string[]) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => watched.includes(l.id)).length;
  const modulesDone = course.modules.filter((m) => m.lessons.every((l) => watched.includes(l.id))).length;
  return {
    lessons: lessons.length,
    minutes: course.modules.reduce((a, m) => a + m.minutes, 0),
    done,
    modulesDone,
    status: done === 0 ? ("not-started" as const) : done === lessons.length ? ("completed" as const) : ("in-progress" as const),
    next: lessons.find((l) => !watched.includes(l.id)) ?? lessons[0],
  };
}
