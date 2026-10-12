"use client";
import { useLocalState, readKey, writeKey } from "./local-store";

/** Secret tokens that let a guest re-open the orders they placed in this browser. Never sent to anyone but our API. */
const KEY = "orbit.guest-orders.v1";
const EMPTY: Record<string, string> = {};
export const saveGuestToken = (orderId: string, token: string) => writeKey(KEY, { ...readKey(KEY, EMPTY), [orderId]: token });
export const useGuestTokens = () => useLocalState(KEY, EMPTY)[0];
