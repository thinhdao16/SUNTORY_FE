import httpClient from '@/config/http-client';

export interface UploadFileResponse {
    name: string;
    linkImage: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
}

export interface UploadApiResponse {
    data: UploadFileResponse[];
}

export interface UploadFileRequest {
    files: File[];
    width?: number;
    height?: number;
    // Optional abort signal to cancel the request
    signal?: AbortSignal;
}

export const uploadSocialFiles = async (request: UploadFileRequest): Promise<UploadApiResponse> => {
    const formData = new FormData();
    request.files.forEach((file, index) => {
        formData.append('Files', file);
    });
    if (request.width) {
        formData.append('Width', request.width.toString());
    }
    if (request.height) {
        formData.append('Height', request.height.toString());
    }
    
    const response = await httpClient.post<UploadApiResponse>('/api/v1/social/upload-file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        // Pass through abort signal if provided
        signal: request.signal,
    });
    
    return response.data;
};
