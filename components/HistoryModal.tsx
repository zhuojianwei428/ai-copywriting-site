"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import {
  deleteHistory,
  clearHistory,
  loadHistory,
  type HistoryItem,
} from "../lib/history";
import { downloadWord } from "../lib/export";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Clerk userId；为空表示游客（此时入口本就不可见） */
  scope: string;
};

function fmt(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

export default function HistoryModal({ open, onClose, scope }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    setItems(loadHistory(scope || "guest"));
  }, [scope]);

  useEffect(() => {
    if (open) {
      refresh();
      setActiveId(null);
      setCopied(false);
    }
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const active = items.find((x) => x.id === activeId) || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-3xl rounded-xl bg-surface-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="font-title-md text-title-md text-text-primary">
            Your history
            <span className="ml-2 font-body-sm text-body-sm text-text-muted">
              {items.length} saved
            </span>
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-canvas"
            type="button"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center font-body-md text-body-md text-text-muted">
            Nothing saved yet. Generate a review and it will show up here.
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            <ul className="space-y-2">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2.5 hover:bg-surface-canvas"
                >
                  <button
                    onClick={() => setActiveId(activeId === it.id ? null : it.id)}
                    className="min-w-0 flex-1 text-left"
                    type="button"
                  >
                    <div className="truncate font-label-md text-label-md text-text-primary">
                      {it.title}
                    </div>
                    <div className="font-body-sm text-body-sm text-text-muted">
                      {it.kind === "scored" ? "Scorecard" : "Narrative"} ·{" "}
                      {fmt(it.createdAt)}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() =>
                        downloadWord(it.content, `history-${it.id.slice(-6)}`)
                      }
                      className="rounded px-2 py-1 font-label-sm text-label-sm text-text-muted hover:bg-surface-card hover:text-text-primary"
                      type="button"
                    >
                      Word
                    </button>
                    <button
                      onClick={() => {
                        deleteHistory(scope || "guest", it.id);
                        if (activeId === it.id) setActiveId(null);
                        refresh();
                      }}
                      className="rounded p-1.5 text-text-muted hover:bg-surface-card hover:text-red-600"
                      type="button"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {active && (
              <div className="mt-4 rounded-lg border border-border-subtle bg-surface-canvas p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-label-md text-label-md text-text-primary">
                    {active.title}
                  </span>
                  <button
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(active.content)
                        .then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        });
                    }}
                    className="rounded border border-border-strong px-2.5 py-1 font-label-sm text-label-sm text-text-primary hover:bg-surface-card"
                    type="button"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap font-body-sm text-body-sm text-text-primary">
                  {active.content}
                </pre>
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="flex justify-end border-t border-border-subtle px-5 py-3">
            <button
              onClick={() => {
                clearHistory(scope || "guest");
                setActiveId(null);
                refresh();
              }}
              className="font-label-sm text-label-sm text-text-muted hover:text-red-600"
              type="button"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
