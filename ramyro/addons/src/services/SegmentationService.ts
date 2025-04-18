import { SegmentationApiUrl } from "@ramyro/addons";
import apiService from "./ApiService";
import { AIFeedBackInterface } from "../types/aifeedback.types"

export async function saveSegmentationAPI(formData: FormData) {
    try {
        const file = formData.get('file');
        if (!(file instanceof File)) {
            throw new Error('No file found in FormData or file field name is incorrect');
        }

        const response = await apiService.post(
            `${SegmentationApiUrl}/save`,
            formData
        );

        return response.data;
    } catch (error) {
        console.error('Error saving segmentation:', error);
        throw error;
    }
}

export async function submitAIFeedbackAPI(feedbackData: AIFeedBackInterface) {
    try {
        console.log("feedbackData.SeriesInstanceUID: ", feedbackData.SeriesInstanceUID);
        const response = await apiService.post(
            `${SegmentationApiUrl}/submit`,
            {
                SeriesInstanceUID: feedbackData.SeriesInstanceUID,
                rating: feedbackData.Rating,
                isAgree: feedbackData.Agree
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error submitting AI feedback:', error);
        throw error;
    }
}