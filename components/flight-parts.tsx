import { getAirline } from "@/lib/airlines";
import { getAirport } from "@/lib/airports";
import type { Leg } from "@/lib/types";
import { cn, diffDays, duration, hhmm } from "@/lib/util";

export function AirlineMark({ code, size = 36 }: { code: string; size?: number }) {
  const a = getAirline(code);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-mono font-bold text-white"
      style={{ width: size, height: size, background: a.color, fontSize: size * 0.33 }}
      aria-hidden
    >
      {a.code}
    </span>
  );
}

export function dayShift(leg: Leg) {
  return diffDays(leg.dep.slice(0, 10), leg.arr.slice(0, 10));
}

export function LegSummary({ leg, label }: { leg: Leg; label?: string }) {
  const shift = dayShift(leg);
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {label && (
        <span className="hidden w-10 shrink-0 whitespace-nowrap text-[11px] font-semibold text-ink-400 sm:block">{label}</span>
      )}
      <div className="w-14 shrink-0 text-right sm:w-16">
        <div className="text-[17px] font-semibold tabular-nums text-ink-900 sm:text-lg">{hhmm(leg.dep)}</div>
        <div className="font-mono text-xs text-ink-500">{leg.from}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <span className="text-xs text-ink-500">{duration(leg.durationMin)}</span>
        <div className="relative my-1 h-px w-full bg-ink-200">
          {leg.layovers.map((l, i) => (
            <span
              key={l.airport}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-coral-500 ring-1 ring-coral-500"
              style={{ left: `${((i + 1) / (leg.layovers.length + 1)) * 100}%` }}
            />
          ))}
          <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-ink-300" />
        </div>
        <span className={cn("text-xs", leg.stops ? "font-medium text-coral-600" : "font-medium text-mint-600")}>
          {leg.stops ? `${leg.stops}회 경유 · ${leg.layovers.map((l) => l.airport).join(", ")}` : "직항"}
        </span>
      </div>
      <div className="w-14 shrink-0 sm:w-16">
        <div className="text-[17px] font-semibold tabular-nums text-ink-900 sm:text-lg">
          {hhmm(leg.arr)}
          {shift !== 0 && (
            <sup className="ml-0.5 text-[10px] font-semibold text-coral-600">
              {shift > 0 ? `+${shift}` : shift}
            </sup>
          )}
        </div>
        <div className="font-mono text-xs text-ink-500">{leg.to}</div>
      </div>
    </div>
  );
}

export function airportName(code: string) {
  const a = getAirport(code);
  return a ? `${a.city} ${a.name}` : code;
}
