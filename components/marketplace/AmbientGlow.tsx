export default function AmbientGlow({ color = "#00e559" }: { color?: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 left-[8%] h-[420px] w-[420px] rounded-full blur-[130px] opacity-10 dark:opacity-20"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute top-[28%] -right-40 h-[560px] w-[560px] rounded-full blur-[150px] opacity-[0.08] dark:opacity-[0.14]"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] h-[480px] w-[480px] rounded-full blur-[140px] opacity-[0.06] dark:opacity-[0.12]"
        style={{ backgroundColor: color }}
      />
      <div className="absolute inset-0 bg-white/0 dark:bg-black/10" />
    </div>
  );
}
