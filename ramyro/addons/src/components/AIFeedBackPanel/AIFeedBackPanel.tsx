import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '@ohif/ui-next';
import classNames from 'classnames';
import { AIFeedBackInterface } from '@ramyro/addons/types/aifeedback.types';
import { submitAIFeedbackAPI } from '@ramyro/addons/services/SegmentationService';

const onFeedbackSubmit = async (feedback : AIFeedBackInterface) => {
  console.log('AI Segmentation Feedback:', feedback);

  await submitAIFeedbackAPI(feedback);
};

/**
 * AI Feedback Panel using PanelSection components
 * Following the same structure as SegmentationExpanded
 */
export function AIFeedbackPanel({
  segmentationId,
  disabled = false,
  servicesManager,
}) {
  const { t } = useTranslation('AIFeedback');
  const [rating, setRating] = useState(null);
  const [agreement, setAgreement] = useState<boolean>(null);

  const handleSubmit = () => {
    if (segmentationId && rating && agreement !== null && onFeedbackSubmit) {
      onFeedbackSubmit(
        {
          SeriesInstanceUID : segmentationId,
          Rating: rating,
          Agree : agreement,
        }
      );

      // Show notification
      if (servicesManager.services.uiNotificationService) {
        servicesManager.services.uiNotificationService.show({
          title: 'Feedback Submitted',
          message: 'Thank you for your feedback on the AI segmentation.',
          type: 'success',
          duration: 3000,
        });
      }
    }
  };

  if (!segmentationId) {
    return null;
  }

  return (
    <PanelSection>
      <PanelSection.Header>
          <span>AI Feedback</span>
      </PanelSection.Header>
      <PanelSection.Content>
        <div className="ai-feedback-section mt-2">
          {/* Rating Section */}
          <div className="mb-4 ml-3">
            <h4 className="text-white text-sm mb-2">
              {t('Rate Segmentation Quality (1-5)')}:
            </h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className="flex items-center cursor-pointer text-white"
                >
                  <input
                    type="radio"
                    name="segmentation-rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => !disabled && setRating(value)}
                    disabled={disabled}
                    className="mr-1"
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Agreement Section */}
          <div className="mb-4 ml-3">
            <h4 className="text-white text-sm mb-2">
              {t('Do you agree with the AI\'s segmentation?')}
            </h4>
            <div className="flex flex-wrap gap-4">
              <label
                className="flex items-center cursor-pointer text-white"
              >
                <input
                  type="radio"
                  name="segmentation-agreement"
                  value="agree"
                  checked={agreement === true}
                  onChange={() => !disabled && setAgreement(true)}
                  disabled={disabled}
                  className="mr-1"
                />
                <span>{t('Agree')}</span>
              </label>
              <label
                className="flex items-center cursor-pointer text-white"
              >
                <input
                  type="radio"
                  name="segmentation-agreement"
                  value="disagree"
                  checked={agreement === false}
                  onChange={() => !disabled && setAgreement(false)}
                  disabled={disabled}
                  className="mr-1"
                />
                <span>{t('Disagree')}</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!rating || agreement === null || disabled}
            className={`w-full py-2 px-4 rounded text-sm font-medium transition duration-300 ${
              !rating || agreement === null || disabled
                ? 'bg-primary-light text-black opacity-50 cursor-not-allowed'
                : 'bg-primary-active text-black hover:opacity-80'
            }`}
          >
            {t('Submit Feedback')}
          </button>
        </div>
      </PanelSection.Content>
    </PanelSection>
  );
}