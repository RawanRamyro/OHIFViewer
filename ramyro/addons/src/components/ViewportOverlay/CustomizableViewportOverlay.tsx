import React, { useCallback } from 'react';
import { vec3 } from 'gl-matrix';
import { metaData, Enums } from '@cornerstonejs/core';
import { ViewportOverlay } from '@ohif/ui';
import { useOverlayConfig } from '../../hooks/useOverlayConfig';
import type { OverlayConfig, OverlayItemProps } from '../../types/overlay.types';
import * as formatters from '../../utils/formatters';
import defaultConfig from './defaultConfig.json';
import {
  OverlayItem,
  VOIOverlayItem,
  ZoomOverlayItem,
  InstanceNumberOverlayItem,
  AgeOverlayItem,
} from './OverlayItems';

const EPSILON = 1e-4;

const OverlayItemComponents = {
  'ohif.overlayItem': OverlayItem,
  'ohif.overlayItem.windowLevel': VOIOverlayItem,
  'ohif.overlayItem.zoomLevel': ZoomOverlayItem,
  'ohif.overlayItem.instanceNumber': InstanceNumberOverlayItem,
  'ohif.overlayItem.age': AgeOverlayItem,
};

const CustomizableViewportOverlay: React.FC<{
  element: HTMLElement;
  viewportData: any;
  imageSliceData: any;
  viewportId: string;
  servicesManager: any;
  config?: OverlayConfig;
}> = ({
  element,
  viewportData,
  imageSliceData,
  viewportId,
  servicesManager,
  config = defaultConfig,
}) => {
  const { voi, scale, instanceNumber, displaySetProps, checkCondition, toolGroupService } =
    useOverlayConfig({
      element,
      viewportData,
      imageSliceData,
      viewportId,
      servicesManager,
    });

  const _renderOverlayItem = useCallback(
    (item, props) => {
      const overlayItemProps: OverlayItemProps = {
        ...props,
        element,
        viewportData,
        imageSliceData,
        viewportId,
        servicesManager,
        customization: item,
        formatters: {
          formatPN: formatters.formatPN,
          formatDate: formatters.formatDICOMDate,
          formatTime: formatters.formatDICOMTime,
          formatBirthDate: formatters.formatBirthDate,
          formatNumberPrecision: formatters.formatNumberPrecision,
        },
        voi,
        scale,
        instanceNumber,
      };

      if (!item) {
        return null;
      }

      // Apply formatters if specified in the configuration
      const applyFormatters = (value: any) => {
        if (item.formatters?.length) {
          return item.formatters.reduce((val, formatter) => {
            if (formatter in overlayItemProps.formatters) {
              return overlayItemProps.formatters[formatter](val);
            }
            return val;
          }, value);
        }
        return value;
      };

      const { customizationType } = item;
      const OverlayItemComponent = OverlayItemComponents[customizationType];

      overlayItemProps.customization = {
        ...item,
        contentF: (props: OverlayItemProps) => {
          const originalValue = props.instance?.[item.attribute];
          return applyFormatters(originalValue);
        },
      };

      if (OverlayItemComponent) {
        return <OverlayItemComponent {...overlayItemProps} />;
      }

      return null;
    },
    [element, viewportData, imageSliceData, viewportId, servicesManager, voi, scale, instanceNumber]
  );

  const getContent = useCallback(
    (customization, keyPrefix: string) => {
      if (!customization?.items) {
        return null;
      }

      const { items } = customization;
      const props = {
        ...displaySetProps,
        voi,
        scale,
        instanceNumber,
        viewportId,
        toolGroupService,
      };

      return (
        <>
          {items.map((item, index) => (
            <div key={`${keyPrefix}_${index}`}>
              {((!item?.condition || checkCondition(item.condition, props)) &&
                _renderOverlayItem(item, props)) ||
                null}
            </div>
          ))}
        </>
      );
    },
    [
      _renderOverlayItem,
      displaySetProps,
      voi,
      scale,
      instanceNumber,
      checkCondition,
      toolGroupService,
    ]
  );

  const topLeftCustomization = { items: config.topLeftItems };
  const topRightCustomization = { items: config.topRightItems };
  const bottomLeftCustomization = { items: config.bottomLeftItems };
  const bottomRightCustomization = { items: config.bottomRightItems };

  return (
    <ViewportOverlay
      topLeft={getContent(topLeftCustomization, 'topLeftOverlayItem')}
      topRight={getContent(topRightCustomization, 'topRightOverlayItem')}
      bottomLeft={getContent(bottomLeftCustomization, 'bottomLeftOverlayItem')}
      bottomRight={getContent(bottomRightCustomization, 'bottomRightOverlayItem')}
    />
  );
};

export default CustomizableViewportOverlay;
