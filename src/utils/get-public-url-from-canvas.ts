import { uploadChatFile } from '@/services/file/file-service';
import { canvasToFile } from '@/utils/canvas-to-file';

export async function getPublicUrlFromCanvas(
    canvasId = 'qr-gen',
    fileName = 'qr-code.png'
): Promise<string | null> {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return null;

    const file = await canvasToFile(canvas, fileName);
    const res = await uploadChatFile(file);
    const url = res?.[0]?.linkImage ?? null;
    return url;
}
