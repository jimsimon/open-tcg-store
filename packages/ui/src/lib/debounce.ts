/**
 * Create a debounced version of a function.
 * The returned function also has a `.cancel()` method to clear the pending timer.
 */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = ((...args: never[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T & { cancel(): void };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
