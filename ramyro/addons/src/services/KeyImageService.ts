import { DicomWebUrl } from "@ramyro/addons";
import apiService from "./ApiService";

export async function setKeyImageAPI(sopInstanceUID: string, description: string) {
    try {
        const response = await apiService.put(
            `${DicomWebUrl}/instances/${sopInstanceUID}/keyImage`,
            {description} 
        );
        return response.data;
    } catch (error) {
        console.error('Failed to set key image', error);
        throw error;
    }
}