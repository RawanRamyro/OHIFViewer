// RamyroAddOns/src/types/viewport.types.ts
export interface ViewportData {
    viewportType: string;
    data: Array<{
        imageIds: string[];
        displaySetInstanceUID: string;
    }>;
}

export interface ImageSliceData {
    imageIndex: number;
    numberOfSlices: number;
}

export interface CameraDetails {
    parallelScale: number;
    scale: number;
}

export interface VolumeData {
    direction: number[];
    imageIds: string[];
}