// RamyroAddOns/src/types/thumbnail.types.ts
export interface ThumbnailParams {
    StudyInstanceUID: string;
    SeriesInstanceUID: string;
    dicomWebConfig: any;
    getAuthorizationHeader: any;
}

export interface ThumbnailResult {
    success: boolean;
    data?: any;
    error?: string;
}