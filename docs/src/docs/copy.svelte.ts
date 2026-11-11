/**
 * Copies text to the clipboard and reports the outcome for a moment: `copied` or `failed`, never both, and
 * never `copied` for a copy that did not happen (the clipboard may be unavailable or refused).
 */
export function createCopier() {
  let state = $state<'idle' | 'copied' | 'failed'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    get copied(): boolean {
      return state === 'copied';
    },
    get failed(): boolean {
      return state === 'failed';
    },
    async copy(text: string): Promise<void> {
      try {
        await navigator.clipboard.writeText(text);
        state = 'copied';
      } catch {
        state = 'failed';
      }
      clearTimeout(timer);
      timer = setTimeout(() => (state = 'idle'), 1500);
    }
  };
}
