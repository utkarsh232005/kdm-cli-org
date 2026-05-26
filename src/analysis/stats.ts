export async function measureDuration<T>(
  action: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await action();
  const durationMs = Math.round(performance.now() - start);
  return { result, durationMs };
}
