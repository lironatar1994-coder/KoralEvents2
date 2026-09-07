export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix local URLs used outside Next Link/router, without changing stored media paths. */
export function appPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || !basePath)
    return value;
  if (value === basePath || value.startsWith(`${basePath}/`)) return value;
  return `${basePath}${value}`;
}
