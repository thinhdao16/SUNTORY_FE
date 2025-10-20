import { useMutation } from 'react-query';
import { uploadSocialFiles, UploadApiResponse, UploadFileRequest } from '@/services/social/social-upload-service';

export interface UploadResponse {
    url: string;
    id?: string;
}

export const useAudioUpload = () => {
    return useMutation({
        mutationFn: async (uploadRequest: UploadFileRequest): Promise<UploadResponse & { filename?: string }> => {
            const response = await uploadSocialFiles(uploadRequest);
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
        mutationFn: async (uploadRequest: UploadFileRequest): Promise<UploadApiResponse> => {
            const response = await uploadSocialFiles(uploadRequest);
            return response;
        },
        onError: (error: any) => {
            console.error('Image upload failed:', error);
        }
    });
};
