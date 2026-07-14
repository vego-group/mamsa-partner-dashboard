import { cn } from "@/lib/cn";

const COLORS = [
  "bg-brand",
  "bg-brand-light",
  "bg-status-approved",
  "bg-status-pending",
  "bg-[#3B6EA5]",
  "bg-[#8A5FB0]",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Initials avatar (no guest photos in the mock data). */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const color = COLORS[hash(name) % COLORS.length];
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-white",
        color,
        className ?? "h-10 w-10 text-sm",
      )}
    >
      {initials}
    </div>
  );
}
