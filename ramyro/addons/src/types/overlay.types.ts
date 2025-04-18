// RamyroAddOns/src/types/overlay.types.ts
export interface OverlayItem {
    id: string;
    customizationType: string;
    label?: string;
    title?: string;
    attribute?: string;
    condition?: string;
    formatters?: string[];
    color?: string;
    background?: string;
}

export interface OverlayConfig {
    topLeftItems: OverlayItem[];
    topRightItems: OverlayItem[];
    bottomLeftItems: OverlayItem[];
    bottomRightItems: OverlayItem[];
}

export interface OverlayItemProps {
    element: HTMLElement;
    viewportData: any;
    imageSliceData: any;
    servicesManager: any;
    viewportId: string;
    instance: any;
    customization: any;
    formatters: {
        formatPN: (val: any) => string;
        formatDate: (val: any) => string;
        formatTime: (val: any) => string;
        formatNumberPrecision: (val: any, precision: number) => string;
        formatBirthDate: (val: any) => string;
    };
    voi?: {
        windowWidth: number;
        windowCenter: number;
    };
    instanceNumber?: number;
    scale?: number;
}