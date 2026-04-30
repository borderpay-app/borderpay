// Eager browser polyfills for Solana libs (@solana/web3.js, @solana/spl-token).
// These libraries reference `Buffer` and `process` at module-eval time, so we
// must install the globals BEFORE any Solana code is imported.
import { Buffer } from "buffer";

const g = globalThis as any;
if (!g.Buffer) g.Buffer = Buffer;
if (typeof window !== "undefined") {
  if (!(window as any).Buffer) (window as any).Buffer = Buffer;
  if (!(window as any).global) (window as any).global = window;
  if (!(window as any).process) (window as any).process = { env: {} };
}

export {};
