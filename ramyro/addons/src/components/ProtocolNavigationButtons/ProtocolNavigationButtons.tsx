// @ramyro/addons/src/components/ProtocolNavigationButtons/ProtocolNavigationButtons.tsx
import React, { useState, useEffect } from 'react';
import { DisplaySetService, HangingProtocolService } from '@ohif/core';
import { hangingProtocolsWithModalities } from '../../services/HangingProtocolService';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  displaySetService: DisplaySetService;
  hangingProtocolService: HangingProtocolService;
}

const ProtocolNavigationButtons: React.FC<Props> = ({
  displaySetService,
  hangingProtocolService,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableProtocols, setAvailableProtocols] = useState([]);

  useEffect(() => {
    checkDisplaySets();

    const subscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      checkDisplaySets
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [displaySetService]);

  const checkDisplaySets = async () => {
    const displaySets = displaySetService.getActiveDisplaySets();

    if (displaySets?.length > 0) {
      const modalities = new Set(displaySets.map(displaySet => displaySet.Modality));

      // Get protocols from the hanging protocol service
      const protocols = hangingProtocolsWithModalities;

      let matchingProtocols = [{ id: 'default', modality: 'default' }];
      modalities.forEach(modality => {
        const protocolsForModality = protocols
          .filter(protocol => protocol.modality === modality)
          .map(protocol => ({
            ...protocol,
            id: String(protocol.id), // Ensure IDs are strings
          }));
        matchingProtocols = [...matchingProtocols, ...protocolsForModality];
      });

      matchingProtocols = Array.from(
        new Map(matchingProtocols.map(protocol => [protocol.id, protocol])).values()
      );

      if (matchingProtocols.length === 0) {
        matchingProtocols = [{ id: 'default', modality: 'default' }];
      }

      setAvailableProtocols(matchingProtocols);
    }
  };

  const updateProtocol = newIndex => {
    const protocol = availableProtocols[newIndex];
    if (!protocol) return;

    hangingProtocolService.setProtocol(protocol.id);

    setCurrentIndex(newIndex);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      updateProtocol(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < availableProtocols.length - 1) {
      updateProtocol(currentIndex + 1);
    }
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < availableProtocols.length - 1;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={handlePrevious}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          !hasPrevious
            ? 'cursor-not-allowed bg-gray-500 opacity-50'
            : 'text-primary-active hover:bg-primary-dark hover:scale-105 active:scale-95'
        }`}
        title="Previous Hanging Protocol"
        disabled={!hasPrevious}
      >
        <ArrowLeft className={`h-4 w-4 ${!hasPrevious ? 'text-white' : 'text-primary-active'}`} />
      </button>

      <span className="text-primary-light min-w-[2.5rem] text-center text-xs font-medium">
        {`${currentIndex + 1}/${availableProtocols.length}`}
      </span>

      <button
        onClick={handleNext}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          !hasNext
            ? 'cursor-not-allowed bg-gray-500 opacity-50'
            : 'text-primary-active hover:bg-primary-dark hover:scale-105 active:scale-95'
        }`}
        title="Next Hanging Protocol"
        disabled={!hasNext}
      >
        <ArrowRight className={`h-4 w-4 ${!hasNext ? 'text-white' : 'text-primary-active'}`} />
      </button>
    </div>
  );
};

export default ProtocolNavigationButtons;
