"use client";

import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getSnapshot = () => onlineManager.isOnline();
const getServerSnapshot = () => true;

/**
 * Online state shared with TanStack Query: `onlineManager` listens to the browser's
 * online/offline events, pauses queries and mutations while offline and resumes them after.
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline };
}
