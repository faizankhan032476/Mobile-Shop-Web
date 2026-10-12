/** Only same-site relative paths are allowed as post-login destinations (prevents open redirects). */
export function safeNext(next: unknown, fallback = "/account"): string {
  return typeof next === "string" && /^\/(?![/\\])[\w\-./?=&%]*$/.test(next) ? next : fallback;
}
