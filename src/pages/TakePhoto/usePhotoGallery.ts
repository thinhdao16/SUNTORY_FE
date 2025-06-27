import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface IPhoto {
  base64?: string;
  webPath?: string;
}

export function usePhotoGallery() {

  const takePhoto = async (): Promise<IPhoto | undefined> => {
    const photoResult = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      quality: 100,
      allowEditing: false,
      promptLabelHeader: t('Image'),
      promptLabelPhoto: t('Choose from gallery'),
      promptLabelPicture: t('Take a photo')
    });
    return {
      base64: photoResult?.base64String,
      webPath: photoResult?.webPath,
    };
  };

  const chooseFromGallery = async (): Promise<IPhoto | undefined> => {
    const photoResult = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 100,
      allowEditing: false,
    });
    return {
      webPath: photoResult?.webPath,
      base64: photoResult?.base64String,
    };
  };

  return {
    takePhoto,
    chooseFromGallery
  };
}

export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject('method did not return a string');
      }
    };
    reader.readAsDataURL(blob);
  });
}