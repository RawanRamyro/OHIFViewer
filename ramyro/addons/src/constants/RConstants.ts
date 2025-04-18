const VIEWER_API_BASE: string = process.env.VIEWER_API_URL || 'http://localhost:8002/api';
const WORKLIST_API_BASE: string = process.env.WORKLIST_API_URL || 'http://localhost:8001/api';
const WORKLIST_FRONT_BASE: string = process.env.WORKLIST_URL || 'http://localhost:9001';

const RDataSource: string = process.env.DATA_SOURCE;
const useExternalWorklist: boolean = process.env.USE_EXTERNAL_WORKLIST === 'true';

const RWorkListRoute: string = useExternalWorklist ? `${WORKLIST_FRONT_BASE}/worklist` : "/";
const ClinicalNotesUrl: string = `${WORKLIST_API_BASE}/ClinicalNotes`;
const DicomWebUrl: string = `${VIEWER_API_BASE}/DicomWeb`;
const HangingProtocolUrl: string = `${VIEWER_API_BASE}/HangingProtocol`;
const SegmentationApiUrl: string = `${VIEWER_API_BASE}/Segmentation`;

export {
    RDataSource,
    RWorkListRoute,
    useExternalWorklist,
    DicomWebUrl,
    HangingProtocolUrl,
    ClinicalNotesUrl,
    SegmentationApiUrl
};