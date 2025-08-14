export async function canvasToFile(
    canvas: HTMLCanvasElement,
    fileName = 'qr-code.png'
): Promise<File> {
    const blob: Blob = await new Promise((resolve, reject) => {
        if (canvas.toBlob) {
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png', 0.92);
        } else {
            try {
                const dataUrl = canvas.toDataURL('image/png');
                fetch(dataUrl).then(r => r.blob()).then(resolve, reject);
            } catch (e) {
                reject(e);
            }
        }
    });
    return new File([blob], fileName, { type: blob.type || 'image/png' });
}
