// RamyroAddOns/src/components/ViewportOverlay/OverlayItems.tsx
import React from 'react';
import type { OverlayItemProps } from '../../types/overlay.types';

export const OverlayItem: React.FC<OverlayItemProps> = props => {
  const { instance, customization = {} } = props;
  const { color = 'white', attribute, title, label, background } = customization;
  const value = customization.contentF?.(props) ?? instance?.[attribute];

  if (value === undefined || value === null) {
    return null;
  }

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color, background }}
      title={title}
    >
      {label ? <span className="mr-1 shrink-0">{label}</span> : null}
      <span className="ml-1 mr-2 shrink-0">{value}</span>
    </div>
  );
};

export const VOIOverlayItem: React.FC<OverlayItemProps> = props => {
  const { voi, customization } = props;
  const { windowWidth, windowCenter } = voi || {};

  if (typeof windowCenter !== 'number' || typeof windowWidth !== 'number') {
    return null;
  }

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: customization?.color ?? 'white' }}
    >
      <span className="mr-1 shrink-0">W:</span>
      <span className="ml-1 mr-2 shrink-0">{windowWidth.toFixed(0)}</span>
      <span className="mr-1 shrink-0">L:</span>
      <span className="ml-1 shrink-0">{windowCenter.toFixed(0)}</span>
    </div>
  );
};

export const ZoomOverlayItem: React.FC<OverlayItemProps> = props => {
  const { scale, customization } = props;

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: customization?.color ?? 'white' }}
    >
      <span className="mr-1 shrink-0">Zoom:</span>
      <span>{scale?.toFixed(2)}x</span>
    </div>
  );
};

export const InstanceNumberOverlayItem: React.FC<OverlayItemProps> = props => {
  const { instanceNumber, imageSliceData, customization } = props;
  const { imageIndex, numberOfSlices } = imageSliceData || {};

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: customization?.color ?? 'white' }}
    >
      <span>
        {instanceNumber !== undefined && instanceNumber !== null ? (
          <>
            <span className="mr-1 shrink-0">I:</span>
            <span>{`${instanceNumber} (${imageIndex + 1}/${numberOfSlices})`}</span>
          </>
        ) : (
          `${imageIndex + 1}/${numberOfSlices}`
        )}
      </span>
    </div>
  );
};

export const AgeOverlayItem: React.FC<OverlayItemProps> = props => {
  const { instance, customization, formatters } = props;
  const birthDate = instance?.PatientBirthDate;

  // Return null if birthDate is null/undefined or formatters is not available
  if (!birthDate || !formatters?.formatBirthDate) {
    return null;
  }

  let age;
  try {
    age = formatters.formatBirthDate(birthDate);
  } catch (error) {
    console.warn('Error formatting birth date:', error);
    return null;
  }

  // Don't render if age calculation failed
  if (!age) {
    return null;
  }

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: customization?.color ?? 'white' }}
    >
      <span className="ml-1 shrink-0">{`${age} years old`}</span>
    </div>
  );
};
