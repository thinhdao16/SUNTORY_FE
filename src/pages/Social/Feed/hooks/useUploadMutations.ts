import { useMutation } from 'react-query';
import { uploadSocialFiles, UploadApiResponse } from '@/services/social/social-upload-service';

export interface UploadResponse {
    url: string;
    id?: string;
}

export const useAudioUpload = () => {
    return useMutation({
        mutationFn: async (audioFile: File): Promise<UploadResponse & { filename?: string }> => {
            const response = await uploadSocialFiles({ files: [audioFile] });
            const uploadData = response.data[0];
            const filename = uploadData?.name 
            return { 
                url: uploadData?.linkImage || '',
                filename: filename
            };
        },
        onError: (error: any) => {
            console.error('Audio upload failed:', error);
        }
    });
};

export const useImageUpload = () => {
    return useMutation({
        mutationFn: async (imageFiles: File[]): Promise<UploadApiResponse> => {
            const response = await uploadSocialFiles({ files: imageFiles });
            return response;
        },
        onError: (error: any) => {
            console.error('Image upload failed:', error);
        }
    });
};
