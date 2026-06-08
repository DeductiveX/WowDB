import { useCallback, useRef, useState } from "react";
import { streamCompletion } from "./ai";
import type { AIMessage, AISettings } from "./ai";

export function useStream() {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (
      messages: AIMessage[],
      settings: AISettings,
      onComplete?: (full: string) => void
    ) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setText("");
      setError(null);
      setStreaming(true);

      let buf = "";
      try {
        for await (const chunk of streamCompletion(messages, settings, ctrl.signal)) {
          buf += chunk;
          setText(buf);
        }
        onComplete?.(buf);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        setStreaming(false);
      }
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { text, streaming, error, run, stop, reset };
}
