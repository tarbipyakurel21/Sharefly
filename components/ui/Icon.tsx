const P: Record<string, string> = {
  search: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z",
  heart: "M12 20s-7-4.4-9-9.2C1.7 7.5 3.6 4.5 6.7 4.5c1.9 0 3.4 1 5.3 3 1.9-2 3.4-3 5.3-3 3.1 0 5 3 3.7 6.3-2 4.8-9 9.2-9 9.2z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  room: "M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8",
  bell: "M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0",
  truck: "M2 6h11v10H2zM13 9h4l3 3v4h-7M6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  camera: "M4 8h3l2-3h6l2 3h3v11H4V8zM12 17a4 4 0 100-8 4 4 0 000 8z",
  check: "M5 12l5 5 9-10",
  x: "M6 6l12 12M18 6L6 18",
  rotate: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  pin: "M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12zM12 11a2 2 0 100-4 2 2 0 000 4z",
};
export function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={P[name] ?? P.plus} />
    </svg>
  );
}
