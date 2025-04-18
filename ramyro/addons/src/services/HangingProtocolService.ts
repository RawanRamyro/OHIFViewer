// RamyroAddOns/src/services/HangingProtocolService.ts
import { HangingProtocolUrl } from '../constants/RConstants';
import apiService from './ApiService';

// Export the promises directly
export const hangingProtocols = await fetchHangingProtocols();
export const hangingProtocolsWithModalities = await fetchHangingProtocolsWithModalities();

async function fetchHangingProtocols() {
  try {
    const response = await apiService.get<any[]>(`${HangingProtocolUrl}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hanging protocols:', error);
    return [];
  }
}

async function fetchHangingProtocolsWithModalities() {
  try {
    const response = await apiService.get<any[]>(`${HangingProtocolUrl}/modalities`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hanging protocols with modalities:', error);
    return [];
  }
}