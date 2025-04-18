import React, { useEffect, useState } from 'react';
import { ServicesManager } from '@ohif/core';
import { AlertTriangle, CheckCircle, X, Save, Loader } from 'lucide-react';

interface SaveOnCloseComponentProps {
  servicesManager: ServicesManager;
}

const SaveOnCloseComponent: React.FC<SaveOnCloseComponentProps> = ({ servicesManager }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const segmentationService = servicesManager.services.segmentationService;

    if (!segmentationService) {
      console.error('SegmentationService not found');
      return;
    }

    // Subscribe to the segmentation service's changes
    const subscription = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
      () => {
        setHasUnsavedChanges(true);
        setIsVisible(true);
      }
    );

    // Handle browser close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        const message =
          'You have unsaved segmentation changes. Do you want to leave without saving?';
        e.returnValue = message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up event listeners - ensure the unsubscribe method is called correctly
    return () => {
      // Check how unsubscribe should be called in your implementation
      if (typeof subscription === 'function') {
        // subscription(); // If unsubscribe is the function itself
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe(); // If unsubscribe is a method on the returned object
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [servicesManager, hasUnsavedChanges]);

  // Save changes method
  const saveChanges = async () => {
    try {
      setIsSaving(true);

      const segmentationService = servicesManager.services.segmentationService;

      if (!segmentationService) {
        throw new Error('SegmentationService not found');
      }

      // Simulate saving for demo purposes
      // Replace with actual save method from your service
      // await segmentationService.saveSegmentations();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // After successful save:
      setHasUnsavedChanges(false);

      // Show success briefly before hiding
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving changes:', error);
      // You could show an error notification here
    } finally {
      setIsSaving(false);
    }
  };

  // Dismiss the notification
  const dismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;
};

export default SaveOnCloseComponent;
