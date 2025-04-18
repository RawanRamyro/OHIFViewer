// src/services/ClinicalNotesAPIService.ts
import apiService from './ApiService';
import { ClinicalNotesUrl } from '../constants/RConstants';

export interface ClinicalNote {
  id: string;
  note: string;
  user: string;
  userId: string;
  studyId: string;
  createdAt: string;
}


interface ApiResponse<T> {
  success: boolean;
  message: string;
  status: string;
  data: T;
  errors: string[];
}

export async function fetchStudyNotes(studyInstanceUID: string): Promise<ApiResponse<ClinicalNote[]>> {
  try {
    const response = await apiService.get<ApiResponse<ClinicalNote[]>>(
      `${ClinicalNotesUrl}/study/instance/${studyInstanceUID}`
    );
    return response.data;

  } catch (error) {
    console.error('Error fetching clinical notes:', error);
    return {
      success: false,
      message: 'Error fetching clinical notes',
      status: 'error',
      data: [],
      errors: [error.message],
    };
  }
}



