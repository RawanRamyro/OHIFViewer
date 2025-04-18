import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Clock, User, Flag, FileText, Loader } from 'lucide-react';
import { fetchStudyNotes } from '@ramyro/addons/services/ClinicalNotesAPIService';
import { ServicesManager } from '@ohif/core';
import '@ramyro/addons/styles/ClinicalNoteDialog.css';

export enum ShowClinicalNotesOption {
  NeverShow = 'never',
  AlwaysShow = 'always',
  ShowOnceAndConfigure = 'configure',
}

interface ClinicalNote {
  id: string;
  note: string;
  user: string;
  userId: string;
  studyId: string;
  createdAt: string;
}

interface ClinicalNoteDialogProps {
  dialogConfiguration?: {
    option: ShowClinicalNotesOption;
    days?: number;
  };
  title?: string;
  servicesManager: ServicesManager;
}

const getStudyInstanceUIDFromCookie = (): string | null => {
  const cookies = document.cookie.split(';');
  const studyInstanceUIDCookie = cookies.find(cookie =>
    cookie.trim().startsWith('studyInstanceUID=')
  );

  if (studyInstanceUIDCookie) {
    return studyInstanceUIDCookie.split('=')[1].trim();
  }
  return null;
};

const ClinicalNoteDialog: React.FC<ClinicalNoteDialogProps> = ({
  dialogConfiguration = {
    option: ShowClinicalNotesOption.AlwaysShow,
  },
  title = 'Clinical Notes',
  servicesManager,
}) => {
  const { option, days } = dialogConfiguration;
  const [isHidden, setIsHidden] = useState(true);
  const [notes, setNotes] = useState<ClinicalNote[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyInstanceUID, setStudyInstanceUID] = useState<string | null>(null);

  useEffect(() => {
    const initializeDialog = async () => {
      const uid = getStudyInstanceUIDFromCookie();
      if (!uid) {
        setError('No study instance UID found');
        setIsLoading(false);
        return;
      }
      setStudyInstanceUID(uid);

      try {
        const response = await fetchStudyNotes(uid);

        if (!response.success) {
          throw new Error(response.message || response.errors?.join(', '));
        }

        // If there are no notes, keep the dialog hidden
        if (!response.data || response.data.length === 0) {
          setIsHidden(true);
          return;
        }

        setNotes(response.data);

        // Only check visibility settings if we have notes
        const dialogLocalState = localStorage.getItem('clinicalNotesDialog');
        const dialogSessionState = sessionStorage.getItem('clinicalNotesDialog');

        switch (option) {
          case ShowClinicalNotesOption.NeverShow:
            setIsHidden(true);
            break;
          case ShowClinicalNotesOption.AlwaysShow:
            setIsHidden(!!dialogSessionState);
            break;
          case ShowClinicalNotesOption.ShowOnceAndConfigure:
            if (dialogLocalState) {
              const { expiryDate } = JSON.parse(dialogLocalState);
              const isExpired = new Date() > new Date(expiryDate);
              setIsHidden(!isExpired);
            } else {
              setIsHidden(false);
            }
            break;
          default:
            setIsHidden(true);
        }
      } catch (err) {
        console.error('Error loading clinical notes:', err);
        setError(err.message || 'Failed to load clinical notes');
        setIsHidden(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDialog();
  }, [option, days]);

  // If there are no notes, or we're still loading, or there's an error, don't show the dialog
  if (isHidden || isLoading || error || !notes || notes.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    const expiryDate = new Date();

    switch (option) {
      case ShowClinicalNotesOption.ShowOnceAndConfigure:
        expiryDate.setDate(expiryDate.getDate() + (days || 1));
        localStorage.setItem('clinicalNotesDialog', JSON.stringify({ expiryDate }));
        break;
      case ShowClinicalNotesOption.AlwaysShow:
        sessionStorage.setItem('clinicalNotesDialog', 'hidden');
        break;
    }
    setIsHidden(true);
  };

  if (isHidden) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="clinical-notes-dialog">
      <div className="clinical-notes-overlay" />

      <div className="clinical-notes-content">
        {/* Header */}
        <div className="clinical-notes-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '9999px',
                }}
              >
                <FileText
                  className="text-blue"
                  style={{ width: '1.25rem', height: '1.25rem' }}
                />
              </div>
              <div>
                <h2
                  className="text-white"
                  style={{ fontSize: '1.25rem', fontWeight: 600 }}
                >
                  {title}
                </h2>
                <p
                  className="text-gray"
                  style={{ fontSize: '0.875rem' }}
                >
                  Review patient's clinical information
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{ padding: '0.5rem', borderRadius: '9999px' }}
              className="text-gray hover:text-white"
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="clinical-notes-body">
          {error ? (
            <div
              className="clinical-note-card"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.2)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
              <p style={{ color: '#ef4444', marginLeft: '0.75rem' }}>{error}</p>
            </div>
          ) : isLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '16rem',
              }}
            >
              <Loader
                className="text-blue"
                style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite' }}
              />
            </div>
          ) : (
            <div>
              {notes?.map(note => (
                <div
                  key={note.id}
                  className="clinical-note-card"
                >
                  <p
                    className="text-white"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {note.note}
                  </p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <div
                      className="text-gray"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <User style={{ width: '1rem', height: '1rem' }} />
                      <span>{note.user || 'Unknown User'}</span>
                    </div>
                    <div
                      className="text-gray"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Clock style={{ width: '1rem', height: '1rem' }} />
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="clinical-notes-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p
              className="text-gray"
              style={{ fontSize: '0.875rem' }}
            >
              Please review all clinical notes carefully
            </p>
            <button
              onClick={handleDismiss}
              className="btn-primary"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalNoteDialog;
