// RamyroAddOns/src/services/ThumbnailService.ts
import { ThumbnailParams, ThumbnailResult } from '../types/thumbnail.types';
import apiService from './ApiService';


export class ThumbnailService {
    static async getThumbnail({
        StudyInstanceUID,
        SeriesInstanceUID,
        dicomWebConfig,
        getAuthorizationHeader
    }: ThumbnailParams): Promise<ThumbnailResult> {
        // Parameter validation
        if (!StudyInstanceUID || !SeriesInstanceUID) {
            return {
                success: false,
                error: 'StudyInstanceUID and SeriesInstanceUID are required to retrieve a thumbnail.'
            };
        }

        try {
            const thumbnailUrl = `${dicomWebConfig.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/thumbnail`;
            const headers = getAuthorizationHeader();

            const response = await apiService.get<any>(thumbnailUrl, { headers });

            if (!response || !response.data) {
                return {
                    success: false,
                    error: 'No data received from the server'
                };
            }

            return {
                success: true,
                data: response.data.thumbnailByteArray
            };

        } catch (error) {
            console.error('Error fetching thumbnail:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}

export default ThumbnailService;