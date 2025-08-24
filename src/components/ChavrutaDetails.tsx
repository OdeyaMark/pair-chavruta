import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, FileText } from 'lucide-react';
import '../styles/ChavrutaDetails.css';

interface Participant {
  fullName: string;
  email: string;
  phone: string;
  country: string;
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
            {participant.phone || 'Not provided'}
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

const ParticipantSections: React.FC = () => {
  const [israeliParticipant] = useState<Participant>({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+972-50-123-4567',
    country: 'Israel'
  });

  const [diasporaParticipant] = useState<Participant>({
    fullName: 'Sarah Cohen',
    email: 'sarah.cohen@example.com',
    phone: '+1-555-123-4567',
    country: 'United States'
  });

  const [note, setNote] = useState<string>('');

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
            <div className="button-group">
              <button
                onClick={() => {
                  setNote('');
                }}
                className="button button-secondary"
              >
                Clear Note
              </button>
              <button
                onClick={() => {
                  const data = {
                    israeliParticipant,
                    diasporaParticipant,
                    note
                  };
                  console.log('Form data:', data);
                  alert('Data saved! Check console for details.');
                }}
                className="button button-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSections;