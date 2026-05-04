import { useCallback, useRef } from 'react';

export function useLongPress(callback: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFireRef = useRef(false);

  const start = useCallback(() => {
    didFireRef.current = false;
    timerRef.current = setTimeout(() => {
      didFireRef.current = true;
      callback();
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 長押し後の click イベントをキャンセルするための ref を返す
  return { start, cancel, didFire: didFireRef };
}
