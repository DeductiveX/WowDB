"use client";
import { useState, useCallback } from "react";

// In-memory password store — never persisted to localStorage or cookies
const memoryStore = new Map<number, string>();

export function usePasswordStore() {
  const [, forceRender] = useState(0);

  const setPassword = useCallback((connectionId: number, password: string) => {
    memoryStore.set(connectionId, password);
    forceRender((n) => n + 1);
  }, []);

  const getPassword = useCallback((connectionId: number): string | undefined => {
    return memoryStore.get(connectionId);
  }, []);

  const clearPassword = useCallback((connectionId: number) => {
    memoryStore.delete(connectionId);
    forceRender((n) => n + 1);
  }, []);

  const hasPassword = useCallback((connectionId: number): boolean => {
    return memoryStore.has(connectionId);
  }, []);

  return { setPassword, getPassword, clearPassword, hasPassword };
}
