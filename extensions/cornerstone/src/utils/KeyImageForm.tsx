import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonEnums } from '@ohif/ui';
import Input from '@ohif/ui/src/components/Input';

interface KeyImageFormProps {
  onClose: () => void;
  onSubmit: (description: string) => void;
}

const KeyImageForm: React.FC<KeyImageFormProps> = ({ onClose, onSubmit }) => {
  const { t } = useTranslation('Modals');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit(description);
    onClose();
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <Input
          id="keyImageDescription"
          label={t('Key Image Description')}
          value={description}
          onChange={evt => setDescription(evt.target.value)}
          onFocus={() => {}}
          onKeyPress={() => {}}
          onKeyDown={() => {}}
          autoFocus={false}
          readOnly={false}
          disabled={false}
          labelChildren={null}
          placeholder="Enter description for the key image (optional)"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          name="cancel"
          type={ButtonEnums.type.secondary}
          onClick={onClose}
        >
          {t('Cancel')}
        </Button>
        <Button
          name="submit"
          type={ButtonEnums.type.primary}
          onClick={handleSubmit}
        >
          {t('Submit')}
        </Button>
      </div>
    </div>
  );
};

export default KeyImageForm; 