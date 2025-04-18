// RamyroAddOns/src/services/ThumbnailManager.ts
export class ThumbnailManager {
    static async processThumbnails({
        displaySets,
        dataSource,
        displaySetService,
        getImageIdForThumbnail,
        getImageSrc,
    }) {
        const results = {};

        await Promise.all(
            displaySets.map(async dSet => {
                try {
                    const displaySet = displaySetService.getDisplaySetByUID(
                        dSet.displaySetInstanceUID
                    );

                    if (displaySet?.unsupported) {
                        return;
                    }

                    let thumbnailSrc = null;

                    // First try: Get thumbnail from DICOM-WEB API
                    try {
                        const base64String = await dataSource.query.series.thumbnail(
                            dSet.StudyInstanceUID,
                            dSet.SeriesInstanceUID
                        );

                        if (base64String) {
                            thumbnailSrc = `data:image/png;base64,${base64String}`;
                        }
                    } catch (error) {
                        console.warn('Error getting thumbnail from DICOM-WEB API:', error);
                    }

                    // Second try: Fall back to OHIF's original logic if thumbnail not found
                    if (!thumbnailSrc || displaySet.Modality == 'MG') {
                        try {
                            const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
                            const imageId = getImageIdForThumbnail(displaySet, imageIds);

                            if (imageId) {
                                thumbnailSrc = await getImageSrc(imageId);
                            }
                        } catch (error) {
                            console.warn('Error getting thumbnail from image loader:', error);
                        }
                    }

                    if (thumbnailSrc) {
                        results[dSet.displaySetInstanceUID] = thumbnailSrc;
                    }
                } catch (error) {
                    console.error(
                        `Error processing thumbnail for displaySet ${dSet.displaySetInstanceUID}:`,
                        error
                    );
                }
            })
        );

        return results;
    }
}