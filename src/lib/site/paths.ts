export const deploymentBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

export function normalizeBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

export function withBasePath(path: string, basePath = deploymentBasePath): string {
  const normalizedBase = normalizeBasePath(basePath);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBase) return normalizedPath;
  if (normalizedPath === "/") return `${normalizedBase}/`;
  return `${normalizedBase}${normalizedPath}`;
}
