import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import '../styles/noteSection.css';

interface NotesSectionProps {
  initialNote?: string;
  onSave: (note: string) => Promise<void>;
}

const NotesSection: React.FC<NotesSectionProps> = ({ 
  initialNote = '', 
  onSave 
}) => {
  const [note, setNote] = useState<string>(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await onSave(note);
      setSaveMessage('Note saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveMessage('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
  );
};

export default NotesSection;