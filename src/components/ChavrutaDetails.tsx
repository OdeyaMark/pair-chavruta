import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, FileText } from 'lucide-react';
import '../styles/ChavrutaDetails.css';

interface Participant {
  fullName: string;
  email: string;
  tel?: string;  // Changed from phone to tel to match your data structure
  country?: string;
}

interface ChavrutaDetailsProps {
  israeliParticipant: Participant;
  diasporaParticipant: Participant;
  chavrutaId: string;
  initialNote?: string; // Add this prop
  onNoteChange?: (note: string) => Promise<void>;
}

interface ParticipantSectionProps {
  title: string;
  participant: Participant;
}

const ParticipantSection: React.FC<ParticipantSectionProps> = ({
  title,
  participant
}) => {
  return (
    <div className="participant-section">
      <h2 className="section-title">
        <User className="icon" />
        {title}
      </h2>
      
      <div className="info-grid">
        <div className="info-row">
          <label className="info-label">
            Full Name:
          </label>
          <div className="info-value">
            {participant.fullName || 'Not provided'}
          </div>
        </div>

        <div className="info-row">
          <label className="info-label">
            <Mail className="icon" />
            Email:
          </label>
          <div className="info-value">
            {participant.email || 'Not provided'}
          </div>
        </div>

        <div className="info-row">
          <label className="info-label">
            <Phone className="icon" />
            Phone:
          </label>
          <div className="info-value">
            {participant.tel || 'Not provided'}
          </div>
        </div>

        <div className="info-row">
          <label className="info-label">
            <MapPin className="icon" />
            Country:
          </label>
          <div className="info-value">
            {participant.country || 'Not provided'}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChavrutaDetails: React.FC<ChavrutaDetailsProps> = ({ 
  israeliParticipant, 
  diasporaParticipant,
  chavrutaId,
  initialNote = '', // Provide default value
  onNoteChange 
}) => {
  const [note, setNote] = useState<string>(initialNote); // Initialize with passed note
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Add effect to update note when initialNote changes
  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const handleSave = async () => {
    if (onNoteChange) {
      setIsSaving(true);
      setSaveMessage('');
      try {
        await onNoteChange(note);
        setSaveMessage('Note saved successfully!');
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error saving note:', error);
        setSaveMessage('Failed to save note. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="chavruta-details-container">
      <div className="sections-grid">
        <ParticipantSection
          title="Israeli Participant"
          participant={israeliParticipant}
        />
        
        <ParticipantSection
          title="Diaspora Participant"
          participant={diasporaParticipant}
        />
      </div>

      <div className="notes-section">
        <h2 className="notes-title">
          <FileText className="icon" />
          Notes
        </h2>
        
        <div>
          <label className="textarea-label">
            Add a note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="textarea"
            placeholder="Enter any additional notes or comments..."
          />
          <div className="controls">
            <div className="char-count">
              {note.length} characters
            </div>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
                {saveMessage}
              </div>
            )}
            <div className="button-group">
              <button
                onClick={() => setNote('')}
                className="button button-secondary"
                disabled={isSaving}
              >
                Clear Note
              </button>
              <button
                onClick={handleSave}
                className="button button-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChavrutaDetails;