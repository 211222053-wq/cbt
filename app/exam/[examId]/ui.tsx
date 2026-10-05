"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  exam: { id: string; title: string; code: string; startsAt: string; endsAt: string; durationMinutes: number };
  activeSession: { id: string; expiresAt: string; status: string } | null;
};

export function ExamClient({ exam, activeSession }: Props) {
  const [sessionId, setSessionId] = useState(activeSession?.id ?? "");
  const [token, setToken] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId || !activeSession?.expiresAt) return;
    const tick = () => {
      setRemaining(Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [sessionId, activeSession?.expiresAt]);

  useEffect(() => {
    if (!sessionId) return;
    const handler = async (type: string, metadata: Record<string, string> = {}) => {
      await fetch("/api/monitoring/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, examId: exam.id, type, metadata }),
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") handler("TAB_SWITCH");
    };

    const onBlur = () => handler("WINDOW_BLUR");
    const onCopy = () => handler("COPY");
    const onPaste = () => handler("PASTE");
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); handler("RIGHT_CLICK"); };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "u"].includes(e.key.toLowerCase())) {
        handler("SHORTCUT", { key: e.key });
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exam.id, sessionId]);

  const remainText = useMemo(() => {
    if (remaining === null) return "-";
    const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
    const ss = (remaining % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [remaining]);

  async function startExam() {
    const res = await fetch(`/api/exams/${exam.id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.message);
      return;
    }
    setSessionId(json.data.sessionId);
    toast.success("Ujian dimulai");
  }

  async function autosaveSample() {
    if (!sessionId) return;
    const res = await fetch(`/api/exams/${exam.id}/autosave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answers: [{ questionId: "sample", answerText: "draft", selectedOptions: [] }],
      }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.message);
    else toast.success("Jawaban tersimpan");
  }

  async function submitExam() {
    if (!sessionId) return;
    const res = await fetch(`/api/exams/${exam.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.message);
      return;
    }
    toast.success(`Submit sukses. Nilai: ${json.data.score}`);
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{exam.title}</h1>
        <span className="rounded bg-slate-100 px-3 py-1 text-sm">Sisa Waktu: {remainText}</span>
      </div>
      {!sessionId ? (
        <div className="space-y-3">
          <p className="text-sm">Kode ujian: {exam.code}</p>
          <input value={token} onChange={(e) => setToken(e.target.value.toUpperCase().trim())} placeholder="Token (jika diperlukan)" />
          <button onClick={startExam} className="rounded bg-[#1d4f8a] px-4 py-2 text-white">Mulai Ujian</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">Session aktif: {sessionId}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={autosaveSample} className="rounded bg-slate-700 px-4 py-2 text-white">Autosave Demo</button>
            <button onClick={submitExam} className="rounded bg-emerald-700 px-4 py-2 text-white">Submit Ujian</button>
          </div>
          <p className="text-xs text-slate-500">Event anti-cheating (tab switch/blur/copy/paste/right-click/shortcut) dicatat selama ujian.</p>
        </div>
      )}
    </div>
  );
}
