import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 12:00 UTC = 9:00 en Chile (verano) / 8:00 (invierno).
crons.daily("monitor diario", { hourUTC: 12, minuteUTC: 0 }, internal.monitor.revisar, {});

export default crons;
