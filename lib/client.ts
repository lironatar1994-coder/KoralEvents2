export async function api<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "הפעולה לא הושלמה");
  return data;
}
export function toLocalInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function fromLocalInput(value: string) {
  const target = new Date(value + "Z").getTime();
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const rendered = new Date(
      toLocalInput(new Date(guess).toISOString()) + "Z",
    ).getTime();
    guess += target - rendered;
  }
  if (toLocalInput(new Date(guess).toISOString()) !== value)
    throw Error("השעה שנבחרה אינה קיימת במעבר לשעון קיץ. יש לבחור שעה אחרת.");
  return new Date(guess).toISOString();
}
