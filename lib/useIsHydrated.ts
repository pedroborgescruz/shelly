"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False during server render and the hydration pass, true afterwards.
 *
 * Progress read from localStorage must not be rendered until after hydration,
 * or the markup will not match what the server produced. Using
 * `useSyncExternalStore` instead of an effect keeps that out of render-time
 * state updates.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
