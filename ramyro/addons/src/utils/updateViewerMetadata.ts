import { ServicesManager } from "@ohif/core";

/**
 * Updates the metadata and refreshes the viewer without page reload
 * @param dataSource The active data source
 * @param notificationCallback Optional callback for showing notifications
 */
export async function updateViewerMetadata(
    dataSource,
    servicesManager: ServicesManager,
    notificationCallback = null
) {
    const { uiNotificationService, displaySetService } = servicesManager.services;

    try {
        // Extract StudyInstanceUID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const studyInstanceUIDs = urlParams.get('StudyInstanceUIDs');

        if (!studyInstanceUIDs) {
            throw new Error('StudyInstanceUID not found in URL');
        }

        // Split by comma in case multiple StudyInstanceUIDs are provided
        const studyInstanceUIDsArray = studyInstanceUIDs.split(',');

        if (notificationCallback) {
            notificationCallback('Updating viewer with new data...', 'info');
        }

        // Call the retrieve.series.metadata for each StudyInstanceUID
        for (const studyInstanceUID of studyInstanceUIDsArray) {
            await dataSource.query.series.search(studyInstanceUID);

            await dataSource.retrieve.series.metadata({
                StudyInstanceUID: studyInstanceUID,
                madeInClient: true,
            });
        }

        // Show notification of successful update
        if (uiNotificationService && typeof uiNotificationService.show === 'function') {
            uiNotificationService.show({
                title: 'Viewer Updated',
                message: 'New series data is now available',
                type: 'success',
                duration: 3000
            });
        }

        console.log('Viewer metadata updated');

        return true;
    } catch (error) {
        console.error('Error updating metadata:', error);

        if (notificationCallback) {
            notificationCallback('Viewer update failed. You may need to refresh.', 'error');
        }

        return false;
    }
}