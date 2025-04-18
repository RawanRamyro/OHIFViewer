// RamyroAddOns/src/hooks/useOverlayConfig.ts
import { useState, useEffect, useCallback } from 'react';
import { vec3 } from 'gl-matrix';
import { metaData, Enums, utilities } from '@cornerstonejs/core';

const EPSILON = 1e-4;

export const useOverlayConfig = ({
    element,
    viewportData,
    imageSliceData,
    viewportId,
    servicesManager,
}) => {
    const {
        cornerstoneViewportService,
        displaySetService,
        toolGroupService,
    } = servicesManager.services;

    const [voi, setVOI] = useState({ windowCenter: null, windowWidth: null });
    const [scale, setScale] = useState(1);
    const { imageIndex } = imageSliceData;

    // Get instance number based on viewport type
    const instanceNumber = useCallback(() => {
        if (!viewportData) return null;

        switch (viewportData.viewportType) {
            case Enums.ViewportType.STACK:
                return getInstanceNumberFromStack(viewportData, imageIndex);
            case Enums.ViewportType.ORTHOGRAPHIC:
                return getInstanceNumberFromVolume(
                    viewportData,
                    viewportId,
                    cornerstoneViewportService,
                    imageIndex
                );
            default:
                return null;
        }
    }, [viewportData, viewportId, imageIndex, cornerstoneViewportService]);

    // Get display set properties
    const displaySetProps = useCallback(() => {
        const displaySets = getDisplaySets(viewportData, displaySetService);
        if (!displaySets) {
            return null;
        }

        const [displaySet] = displaySets;
        const { instances, instance: referenceInstance } = displaySet;

        return {
            displaySets,
            displaySet,
            instance: instances?.[imageIndex],
            instances,
            referenceInstance,
        };
    }, [viewportData, imageIndex, displaySetService]);

    // VOI change handler
    useEffect(() => {
        const updateVOI = event => {
            const { range } = event.detail;
            if (!range) return;

            const { lower, upper } = range;
            const { windowWidth, windowCenter } = utilities.windowLevel.toWindowLevel(lower, upper);
            setVOI({ windowCenter, windowWidth });
        };

        element.addEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
        return () => {
            element.removeEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
        };
    }, [element]);

    // Scale change handler
    useEffect(() => {
        const updateScale = event => {
            const { previousCamera, camera } = event.detail;

            if (
                previousCamera.parallelScale !== camera.parallelScale ||
                previousCamera.scale !== camera.scale
            ) {
                const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
                if (!viewport) return;

                const scale = viewport.getZoom();
                setScale(scale);
            }
        };

        element.addEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);
        return () => {
            element.removeEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);
        };
    }, [viewportId, cornerstoneViewportService, element]);

    // Condition checker
    const checkCondition = useCallback(
        (condition, props) => {
            if (!condition) return true;
            const referenceInstance = props.referenceInstance || {};

            switch (condition) {
                case 'hasStudyDate':
                    return referenceInstance?.StudyDate;
                case 'hasSeriesDescription':
                    return referenceInstance?.SeriesDescription;
                case 'isZoomTool':
                    return toolGroupService.getActiveToolForViewport(viewportId) === 'Zoom';
                case 'hasPatientName':
                    return referenceInstance.PatientName;
                case 'hasPatientID':
                    return referenceInstance.PatientID;
                case 'hasPatientBirthDate':
                    return referenceInstance.PatientBirthDate;
                case 'hasPatientSex':
                    return referenceInstance.PatientSex;
                default:
                    return true;
            }
        },
        [viewportId, toolGroupService]
    );

    return {
        voi,
        scale,
        instanceNumber: instanceNumber(),
        displaySetProps: displaySetProps(),
        checkCondition,
        toolGroupService,
    };
};

// Helper functions
function getInstanceNumberFromStack(viewportData, imageIndex) {
    const imageIds = viewportData.data[0].imageIds;
    const imageId = imageIds[imageIndex];

    if (!imageId) return null;

    const generalImageModule = metaData.get('generalImageModule', imageId) || {};
    const { instanceNumber } = generalImageModule;

    return imageIds.length <= 1 ? null : parseInt(instanceNumber);
}

function getInstanceNumberFromVolume(
    viewportData,
    viewportId,
    cornerstoneViewportService,
    imageIndex
) {
    const volumes = viewportData.data;
    if (!volumes) return null;

    const { volume } = volumes[0];
    if (!volume) return null;

    const { direction, imageIds } = volume;
    const cornerstoneViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!cornerstoneViewport) return null;

    const camera = cornerstoneViewport.getCamera();
    const { viewPlaneNormal } = camera;
    const scanAxisNormal = direction.slice(6, 9);

    const cross = vec3.cross(vec3.create(), viewPlaneNormal, scanAxisNormal);
    const isAcquisitionPlane = vec3.length(cross) < EPSILON;

    if (isAcquisitionPlane) {
        const imageId = imageIds[imageIndex];
        if (!imageId) return null;

        const { instanceNumber } = metaData.get('generalImageModule', imageId) || {};
        return parseInt(instanceNumber);
    }

    return null;
}

function getDisplaySets(viewportData, displaySetService) {
    if (!viewportData?.data?.length) {
        return null;
    }

    const displaySets = viewportData.data
        .map(datum => displaySetService.getDisplaySetByUID(datum.displaySetInstanceUID))
        .filter(Boolean);

    return displaySets.length ? displaySets : null;
}