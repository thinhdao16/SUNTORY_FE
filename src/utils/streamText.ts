import type { StreamEvent } from "@/store/zustand/signalr-stream-store";

type AddStreamChunk = (chunk: any) => void;

const toGraphemes = (s: string): string[] => {
    if (typeof Intl !== "undefined" && typeof (Intl as any).Segmenter === "function") {
        // @ts-ignore
        const seg = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" });
        // @ts-ignore
        return Array.from(seg.segment(s), (x: any) => x.segment);
    }
    return Array.from(s);
};


export function streamText(
    fullText: string,
    meta: { id?: number; code?: string; chatCode: string; messageCode: string },
    addStreamChunk: AddStreamChunk,
    setLoadingStream: (loading: boolean) => void,
    onComplete?: (event: StreamEvent) => void,
    options?: { chunkSize?: number; intervalMs?: number }
) {
    const CHUNK_SIZE = options?.chunkSize ?? 4;
    const INTERVAL_MS = options?.intervalMs ?? 5;

    const tokens = toGraphemes(fullText);
    let currentText = "";
    let index = 0;
    let done = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const finish = () => {
        if (done) return;
        done = true;
        if (timer) clearInterval(timer);
        setLoadingStream(false);
    };

    setLoadingStream(true);

    if (tokens.length === 0) {
        addStreamChunk({
            ...meta,
            completeText: "",
            chunk: "",
            isComplete: true,
            timestamp: new Date().toISOString(),
        });
        onComplete?.({
            chatCode: meta.chatCode,
            messageCode: meta.messageCode,
            timestamp: new Date().toISOString(),
            code: meta.code ?? "",
            id: meta.id ?? 0,
            completeText: "",
        });
        finish();
        return () => { };
    }

    timer = setInterval(() => {
        try {
            if (index >= tokens.length) {
                finish();
                return;
            }

            const slice = tokens.slice(index, Math.min(index + CHUNK_SIZE, tokens.length)).join("");
            currentText += slice;
            index += CHUNK_SIZE;

            addStreamChunk({
                ...meta,
                completeText: currentText,
                chunk: slice,
                timestamp: new Date().toISOString(),
            });

            if (index >= tokens.length) {
                addStreamChunk({
                    ...meta,
                    completeText: currentText,
                    chunk: "",
                    isComplete: true,
                    timestamp: new Date().toISOString(),
                });

                onComplete?.({
                    chatCode: meta.chatCode,
                    messageCode: meta.messageCode,
                    timestamp: new Date().toISOString(),
                    code: meta.code ?? "",
                    id: meta.id ?? 0,
                    completeText: currentText,
                });

                finish();
            }
        } catch (err) {
            console.error("streamText tick error:", err);
            finish();
        }
    }, INTERVAL_MS);

    return () => finish();
}
