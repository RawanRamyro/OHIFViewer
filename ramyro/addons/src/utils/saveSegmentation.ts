import { CommandsManager, ExtensionManager, ServicesManager } from '@ohif/core';
import SegmentationService from 'extensions/cornerstone/src/services/SegmentationService';
import { saveSegmentationAPI } from '../services/SegmentationService';
import { data } from 'dcmjs';
import { Buffer } from 'buffer';
import { updateViewerMetadata } from './updateViewerMetadata';

const { datasetToDict } = data;

interface SaveSegmentationParams {
  commandsManager: CommandsManager;
  servicesManager: ServicesManager;
  extensionManager: ExtensionManager;
  segmentationService: SegmentationService;
  segmentationId: string;
  segSeriesInstanceUID: string;
}

async function saveSegmentation({
  commandsManager,
  servicesManager,
  extensionManager,
  segmentationService,
  segmentationId,
  segSeriesInstanceUID,
}: SaveSegmentationParams): Promise<void> {
  const { uiNotificationService, displaySetService } = servicesManager.services;

  console.log("SeriesInstanceUID: ",segSeriesInstanceUID);
  let notificationDisplayed = false;

  const showOrUpdateNotification = (
    message: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) => {
    if (!notificationDisplayed) {
      notificationDisplayed = true;
    }
    uiNotificationService.show({
      title: 'Saving Segmentation',
      message: message,
      type: type,
    });
  };

  try {
    // Initial state
    showOrUpdateNotification('Preparing segmentation data... (1/4)');

    const segmentation = segmentationService.getSegmentation(segmentationId);
    console.log(segmentation);
    if (!segmentation) {
      throw new Error(`No segmentation found with ID: ${segmentationId}`);
    }

    // Generate the segmentation
    showOrUpdateNotification('Generating segmentation data... (2/4)');

    const generatedSegmentation: any = commandsManager.run('generateSegmentation', {
      segmentationId,
      options: {
        SeriesDescription: segmentation.label || 'Research Derived Series',
      }
    });

    if (!generatedSegmentation || !generatedSegmentation.dataset) {
      throw new Error('Failed to generate segmentation data');
    }

    // Convert to blob
    showOrUpdateNotification('Processing segmentation... (3/4)');

    let segmentationBlob;
    if (generatedSegmentation.dataset instanceof ArrayBuffer) {
      segmentationBlob = new Blob([generatedSegmentation.dataset], {
        type: 'application/dicom',
      });
    } else {
      if (!generatedSegmentation.dataset._meta) {
        throw new Error('Dataset must have a _meta property');
      }
      const buffer = Buffer.from(datasetToDict(generatedSegmentation.dataset).write());
      segmentationBlob = new Blob([buffer], {
        type: 'application/dicom',
      });
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', segmentationBlob, `${segmentation.label || 'segmentation'}.dcm`);

    // Upload to API
    showOrUpdateNotification('Uploading segmentation... (4/4)');

    await saveSegmentationAPI(formData);

    // Success state
    showOrUpdateNotification('Segmentation has been saved successfully', 'success');

    // Update viewer metadata
    // await updateViewerMetadata(dataSource, servicesManager, showOrUpdateNotification);

  } catch (error) {
    console.error('Segmentation save error:', error);

    // Error state
    showOrUpdateNotification(error.message || 'Failed to save segmentation', 'error');

    throw error;
  }
}

export { saveSegmentation };
