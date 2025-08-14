export function streamText(fullText: string, meta: any, addStreamChunk: (chunk: any) => void) {
    let currentText = "";
    let index = 0;

    const interval = setInterval(() => {
        currentText += fullText[index];
        index++;

        addStreamChunk({
            ...meta,
            completeText: currentText,
            chunk: fullText[index - 1],
        });

        if (index >= fullText.length) {
            clearInterval(interval);
            addStreamChunk({
                ...meta,
                completeText: currentText,
                chunk: "",
                isComplete: true
            });
        }
    }, 5);
}