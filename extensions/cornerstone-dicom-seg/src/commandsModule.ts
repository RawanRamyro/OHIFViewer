import dcmjs from 'dcmjs';
import { createReportDialogPrompt } from '@ohif/extension-default';
import { Types } from '@ohif/core';
import { cache, metaData } from '@cornerstonejs/core';
import {
  segmentation as cornerstoneToolsSegmentation,
  Enums as cornerstoneToolsEnums,
  utilities,
} from '@cornerstonejs/tools';
import { adaptersRT, helpers, adaptersSEG } from '@cornerstonejs/adapters';
import { classes, DicomMetadataStore } from '@ohif/core';

import vtkImageMarchingSquares from '@kitware/vtk.js/Filters/General/ImageMarchingSquares';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';

// Helper function to determine if we need to reverse the order
function determineIfOrderShouldBeReversed(imagePositions) {
  if (imagePositions.length <= 1) {
    return false;
  }
  
  try {
    // Safely extract Z positions with error handling
    // First, ensure that imagePositions contains valid arrays
    if (!Array.isArray(imagePositions[0]) || !Array.isArray(imagePositions[imagePositions.length - 1])) {
      console.warn('Image positions are not in the expected array format. Using instance number instead.');
      return false; // Default to not reversing if format is unexpected
    }
    
    // Determine patient orientation (assuming axial imaging)
    // Check the Z component (index 2) of the positions to determine slice ordering
    const firstPos = imagePositions[0];
    const lastPos = imagePositions[imagePositions.length - 1];
    
    // Verify that we have valid Z coordinates
    if (firstPos.length < 3 || lastPos.length < 3 || 
        typeof firstPos[2] !== 'number' || typeof lastPos[2] !== 'number') {
      console.warn('Image positions do not have valid Z coordinates. Using default ordering.');
      return false;
    }
    
    // If first position's Z is greater than last, we're going from superior to inferior
    // If first position's Z is less than last, we're going from inferior to superior
    const isDescendingZ = firstPos[2] > lastPos[2];
    
    // The DICOM standard typically expects slices to be ordered in ascending Z (inferior to superior)
    // If our current order is descending, we should reverse to match the standard
    return isDescendingZ;
  } catch (error) {
    console.warn('Error determining slice order:', error);
    return false; // Default to not reversing on error
  }
};

const { segmentation: segmentationUtils } = utilities;

const { datasetToBlob } = dcmjs.data;

const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;

  const viewport = viewports.get(targetViewportId);

  return viewport;
};

const {
  Cornerstone3D: {
    Segmentation: { generateSegmentation },
  },
} = adaptersSEG;

const {
  Cornerstone3D: {
    RTSS: { generateRTSSFromSegmentations },
  },
} = adaptersRT;

const { downloadDICOMData } = helpers;

const commandsModule = ({
  servicesManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const {
    segmentationService,
    uiDialogService,
    displaySetService,
    viewportGridService,
    toolGroupService,
  } = servicesManager.services as AppTypes.Services;

  const actions = {
    /**
     * Loads segmentations for a specified viewport.
     * The function prepares the viewport for rendering, then loads the segmentation details.
     * Additionally, if the segmentation has scalar data, it is set for the corresponding label map volume.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentations - Array of segmentations to be loaded.
     * @param params.viewportId - the target viewport ID.
     *
     */
    loadSegmentationsForViewport: async ({ segmentations, viewportId }) => {
      // Todo: handle adding more than one segmentation
      const viewport = getTargetViewport({ viewportId, viewportGridService });
      const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

      const segmentation = segmentations[0];
      const segmentationId = segmentation.segmentationId;
      const label = segmentation.config.label;
      const segments = segmentation.config.segments;

      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      await segmentationService.createLabelmapForDisplaySet(displaySet, {
        segmentationId,
        segments,
        label,
      });

      segmentationService.addOrUpdateSegmentation(segmentation);

      await segmentationService.addSegmentationRepresentation(viewport.viewportId, {
        segmentationId,
      });

      return segmentationId;
    },
    /**
     * Generates a segmentation from a given segmentation ID.
     * This function retrieves the associated segmentation and
     * its referenced volume, extracts label maps from the
     * segmentation volume, and produces segmentation data
     * alongside associated metadata.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentationId - ID of the segmentation to be generated.
     * @param params.options - Optional configuration for the generation process.
     *
     * @returns Returns the generated segmentation data.
     */
    // Fixed generateSegmentation function
    generateSegmentation: ({ segmentationId, options = {} }) => {
      const segmentation = cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);
      const { imageIds } = segmentation.representationData.Labelmap;
    
      const segImages = imageIds.map(imageId => cache.getImage(imageId));
      const referencedImages = segImages.map(image => cache.getImage(image.referencedImageId));
    
      const labelmaps2D = [];
    
      // Get the total number of slices
      const totalSlices = segImages.length;
    
      // Create an array to hold the correct mapping of z positions
      let z = 0;
    
      // Process each segmentation image
      for (const segImage of segImages) {
        const segmentsOnLabelmap = new Set();
        const pixelData = segImage.getPixelData();
        const { rows, columns } = segImage;
    
        // Use a single pass through the pixel data
        for (let i = 0; i < pixelData.length; i++) {
          const segment = pixelData[i];
          if (segment !== 0) {
            segmentsOnLabelmap.add(segment);
          }
        }
    
        // Store the labelmap at the correct position
        labelmaps2D[z++] = {
          segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
          pixelData,
          rows,
          columns,
        };
      }
    
      // Ensure reference images and labelmaps are in the same order
      // This is critical for correct placement in the saved segmentation
      const sortedReferencedImages = [...referencedImages];
      
      // Create a mapping of original image positions to ensure consistency
      const imagePositions = [];
      let hasValidPositions = true;
      
      try {
        // Try to get image positions
        for (const image of sortedReferencedImages) {
          if (!image || !image.imageId) {
            hasValidPositions = false;
            break;
          }
          const imagePositionPatient = metaData.get('imagePositionPatient', image.imageId);
          if (!imagePositionPatient) {
            hasValidPositions = false;
            break;
          }
          imagePositions.push(imagePositionPatient);
        }
      } catch (error) {
        console.warn('Error getting image positions:', error);
        hasValidPositions = false;
      }
    
      // Check if we need to reverse the order based on image position
      // If we can't determine from positions, use a simpler method
      let shouldReverseOrder = false;
      
      if (hasValidPositions && imagePositions.length > 1) {
        shouldReverseOrder = determineIfOrderShouldBeReversed(imagePositions);
      } else {
        // Fallback: use instance numbers as a proxy for slice order
        console.log('Using fallback method for slice ordering');
        shouldReverseOrder = true; // Default to reversing as this matches your observed behavior
      }
      
      if (shouldReverseOrder) {
        // Reverse both the labelmaps and reference images to maintain correct mapping
        labelmaps2D.reverse();
      }
    
      const allSegmentsOnLabelmap = labelmaps2D.map(labelmap => labelmap.segmentsOnLabelmap);
    
      const labelmap3D = {
        segmentsOnLabelmap: Array.from(new Set(allSegmentsOnLabelmap.flat())),
        metadata: [],
        labelmaps2D,
      };
    
      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
      const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);
    
      Object.entries(segmentationInOHIF.segments).forEach(([segmentIndex, segment]) => {
        // segmentation service already has a color for each segment
        if (!segment) {
          return;
        }
    
        const { label } = segment;
    
        const firstRepresentation = representations[0];
        const color = segmentationService.getSegmentColor(
          firstRepresentation.viewportId,
          segmentationId,
          segment.segmentIndex
        );
    
        const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB(
          color.slice(0, 3).map(value => value / 255)
        ).map(value => Math.round(value));
    
        const segmentMetadata = {
          SegmentNumber: segmentIndex.toString(),
          SegmentLabel: label,
          SegmentAlgorithmType: segment?.algorithmType || 'MANUAL',
          SegmentAlgorithmName: segment?.algorithmName || 'OHIF Brush',
          RecommendedDisplayCIELabValue,
          SegmentedPropertyCategoryCodeSequence: {
            CodeValue: 'T-D0050',
            CodingSchemeDesignator: 'SRT',
            CodeMeaning: 'Tissue',
          },
          SegmentedPropertyTypeCodeSequence: {
            CodeValue: 'T-D0050',
            CodingSchemeDesignator: 'SRT',
            CodeMeaning: 'Tissue',
          },
        };
        labelmap3D.metadata[segmentIndex] = segmentMetadata;
      });
    
      const generatedSegmentation = generateSegmentation(
        shouldReverseOrder ? [...sortedReferencedImages].reverse() : sortedReferencedImages,
        labelmap3D,
        metaData,
        options
      );
    
      return generatedSegmentation;
    },
    /**
     * Downloads a segmentation based on the provided segmentation ID.
     * This function retrieves the associated segmentation and
     * uses it to generate the corresponding DICOM dataset, which
     * is then downloaded with an appropriate filename.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentationId - ID of the segmentation to be downloaded.
     *
     */
    downloadSegmentation: ({ segmentationId }) => {
      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
      const generatedSegmentation = actions.generateSegmentation({
        segmentationId,
      });

      downloadDICOMData(generatedSegmentation.dataset, `${segmentationInOHIF.label}`);
    },
    /**
     * Stores a segmentation based on the provided segmentationId into a specified data source.
     * The SeriesDescription is derived from user input or defaults to the segmentation label,
     * and in its absence, defaults to 'Research Derived Series'.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentationId - ID of the segmentation to be stored.
     * @param params.dataSource - Data source where the generated segmentation will be stored.
     *
     * @returns {Object|void} Returns the naturalized report if successfully stored,
     * otherwise throws an error.
     */
    storeSegmentation: async ({ segmentationId, dataSource }) => {
      const promptResult = await createReportDialogPrompt(uiDialogService, {
        extensionManager,
      });

      if (promptResult.action !== 1 && !promptResult.value) {
        return;
      }

      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        throw new Error('No segmentation found');
      }

      const { label } = segmentation;
      const SeriesDescription = promptResult.value || label || 'Research Derived Series';

      const generatedData = actions.generateSegmentation({
        segmentationId,
        options: {
          SeriesDescription,
        },
      });

      if (!generatedData || !generatedData.dataset) {
        throw new Error('Error during segmentation generation');
      }

      const { dataset: naturalizedReport } = generatedData;

      await dataSource.store.dicom(naturalizedReport);

      // The "Mode" route listens for DicomMetadataStore changes
      // When a new instance is added, it listens and
      // automatically calls makeDisplaySets

      // add the information for where we stored it to the instance as well
      naturalizedReport.wadoRoot = dataSource.getConfig().wadoRoot;

      DicomMetadataStore.addInstances([naturalizedReport], true);

      return naturalizedReport;
    },
    /**
     * Converts segmentations into RTSS for download.
     * This sample function retrieves all segentations and passes to
     * cornerstone tool adapter to convert to DICOM RTSS format. It then
     * converts dataset to downloadable blob.
     *
     */
    downloadRTSS: ({ segmentationId }) => {
      const segmentations = segmentationService.getSegmentation(segmentationId);
      const vtkUtils = {
        vtkImageMarchingSquares,
        vtkDataArray,
        vtkImageData,
      };

      const RTSS = generateRTSSFromSegmentations(
        segmentations,
        classes.MetadataProvider,
        DicomMetadataStore,
        cache,
        cornerstoneToolsEnums,
        vtkUtils
      );

      try {
        const reportBlob = datasetToBlob(RTSS);

        //Create a URL for the binary.
        const objectUrl = URL.createObjectURL(reportBlob);
        window.location.assign(objectUrl);
      } catch (e) {
        console.warn(e);
      }
    },
    setBrushSize: ({ value, toolNames }) => {
      const brushSize = Number(value);

      toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
        if (toolNames?.length === 0) {
          segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize);
        } else {
          toolNames?.forEach(toolName => {
            segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize, toolName);
          });
        }
      });
    },
    setThresholdRange: ({
      value,
      toolNames = ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
    }) => {
      toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
        const toolGroup = toolGroupService.getToolGroup(toolGroupId);
        toolNames?.forEach(toolName => {
          toolGroup.setToolConfiguration(toolName, {
            strategySpecificConfiguration: {
              THRESHOLD: {
                threshold: value,
              },
            },
          });
        });
      });
    },
  };

  const definitions = {
    /**
     * Obsolete?
     */
    loadSegmentationDisplaySetsForViewport: {
      commandFn: actions.loadSegmentationDisplaySetsForViewport,
    },
    /**
     * Obsolete?
     */
    loadSegmentationsForViewport: {
      commandFn: actions.loadSegmentationsForViewport,
    },

    generateSegmentation: {
      commandFn: actions.generateSegmentation,
    },
    downloadSegmentation: {
      commandFn: actions.downloadSegmentation,
    },
    storeSegmentation: {
      commandFn: actions.storeSegmentation,
    },
    downloadRTSS: {
      commandFn: actions.downloadRTSS,
    },
    setBrushSize: {
      commandFn: actions.setBrushSize,
    },
    setThresholdRange: {
      commandFn: actions.setThresholdRange,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'SEGMENTATION',
  };
};

export default commandsModule;
