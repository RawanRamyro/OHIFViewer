// RamyroAddOns/src/hooks/useThumbnailLoader.ts
import { useState, useEffect } from 'react';
import { ThumbnailManager } from '../services/ThumbnailManager';

export const useThumbnailLoader = ({
    displaySetService,
    dataSource,
    getImageSrc,
    activeViewportId,
    thumbnailNoImageModalities = [],
    getImageIdForThumbnail,
}) => {
    const [hasLoadedViewports, setHasLoadedViewports] = useState(false);
    const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});
    const [jumpToDisplaySet, setJumpToDisplaySet] = useState(null);
    const [loadingState, setLoadingState] = useState({});

    // Handle initial viewport loading
    useEffect(() => {
        if (!hasLoadedViewports && activeViewportId) {
            window.setTimeout(() => setHasLoadedViewports(true), 250);
        }
    }, [activeViewportId, hasLoadedViewports]);

    // Handle initial thumbnails
    useEffect(() => {
        if (!hasLoadedViewports) {
            return;
        }

        const loadThumbnails = async () => {
            let currentDisplaySets = displaySetService.activeDisplaySets;
            currentDisplaySets = currentDisplaySets.filter(
                ds => !thumbnailNoImageModalities.includes(ds.Modality)
            );

            if (!currentDisplaySets.length) {
                return;
            }

            const results = await ThumbnailManager.processThumbnails({
                displaySets: currentDisplaySets,
                dataSource,
                displaySetService,
                getImageIdForThumbnail,
                getImageSrc,
            });

            setThumbnailImageSrcMap(prevState => ({
                ...prevState,
                ...results
            }));
        };

        loadThumbnails();
    }, [displaySetService, dataSource, getImageSrc, activeViewportId, hasLoadedViewports]);

    // Handle display sets subscription
    useEffect(() => {
        if (!hasLoadedViewports) {
            return;
        }

        const subscription = displaySetService.subscribe(
            displaySetService.EVENTS.DISPLAY_SETS_ADDED,
            async ({ displaySetsAdded, options }) => {
                if (options?.madeInClient) {
                    const displaySetInstanceUID = displaySetsAdded[0]?.displaySetInstanceUID;
                    if (displaySetInstanceUID) {
                        setJumpToDisplaySet(displaySetInstanceUID);
                    }
                }

                const results = await ThumbnailManager.processThumbnails({
                    displaySets: displaySetsAdded,
                    dataSource,
                    displaySetService,
                    getImageIdForThumbnail,
                    getImageSrc,
                });

                setThumbnailImageSrcMap(prevState => ({
                    ...prevState,
                    ...results
                }));
            }
        );

        return () => subscription.unsubscribe();
    }, [displaySetService, dataSource, getImageSrc, hasLoadedViewports]);

    // Additional helper function to manually trigger thumbnail loading
    const reloadThumbnail = async (displaySetInstanceUID) => {
        const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
        if (!displaySet) return;

        const results = await ThumbnailManager.processThumbnails({
            displaySets: [displaySet],
            dataSource,
            displaySetService,
            getImageIdForThumbnail,
            getImageSrc,
        });

        setThumbnailImageSrcMap(prevState => ({
            ...prevState,
            ...results
        }));
    };

    return {
        thumbnailImageSrcMap,
        hasLoadedViewports,
        jumpToDisplaySet,
        setJumpToDisplaySet,
        loadingState,
        reloadThumbnail,
    };
};

export default useThumbnailLoader;