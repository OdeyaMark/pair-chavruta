import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Globe, User, BookOpen, MessageCircle, Calendar } from 'lucide-react';
import './UserCard.css';
import { getTracks } from '../data/cmsData';
import { 
  formatUserData, 
  type ChavrutaCardProps, 
  type LabelValuePair, 
  type Question, 
  type LearningTimes 
} from '../data/formatters';

interface Track {
  id: string;
  trackEn: string;
}

const EditableLabelValue = React.memo<{ 
  item: LabelValuePair;
  onChange: (value: string) => void;
}>(({ item, onChange }) => (
  <div className="label-value-item">
    <span className="item-label">{item.label}:</span>
    <input
      type="text"
      value={item.value}
      onChange={(e) => onChange(e.target.value)}
      className="editable-value"
    />
  </div>
));

const LabelValueSection = React.memo<{ 
  title: string; 
  items: LabelValuePair[]; 
  icon: React.ReactNode;
  isEditMode?: boolean;
  onItemChange?: (index: number, value: string) => void;
  onItemRemove?: (index: number) => void;
  onItemAdd?: () => void;
  showAddButton?: boolean;
}>(({ 
  title, 
  items, 
  icon, 
  isEditMode, 
  onItemChange,
  onItemRemove,
  onItemAdd,
  showAddButton
}) => (
  <div className="card-section">
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <h3 className="section-title">{title}</h3>
      {isEditMode && showAddButton && (
        <button 
          className="add-item-button"
          onClick={onItemAdd}
        >
          <Plus size={16} />
          Add {title.slice(0, -1)} {/* Removes 's' from title */}
        </button>
      )}
    </div>
    <div className="label-value-grid">
      {items.map((item, index) => (
        <div key={index} className="label-value-item">
          {isEditMode && onItemChange ? (
            <>
              <EditableLabelValue
                item={item}
                onChange={(value) => onItemChange(index, value)}
              />
              {onItemRemove && (
                <button
                  className="remove-item-button"
                  onClick={() => onItemRemove(index)}
                >
                  <X size={14} />
                </button>
              )}
            </>
          ) : (
            <>
              <span className="item-label">{item.label}:</span>
              <span className="item-value">{item.value}</span>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
));

const UserCard = React.memo<UserCardProps>(({ user }) => {
  const [cardData, setCardData] = useState<ChavrutaCardProps | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [showTrackSelector, setShowTrackSelector] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await formatUserData(user);
      setCardData(data);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const loadTracks = async () => {
      const tracks = await getTracks();
      setAvailableTracks(tracks);
    };
    loadTracks();
  }, []);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  if (!cardData) {
    return (
      <div className="user-card-container">
        <div className="card-section">
          <div className="section-header">
            <h3 className="section-title">Loading user data...</h3>
          </div>
        </div>
      </div>
    );
  }

  const {
    chavrutaPreference,
    extraDetails,
    learningTracks,
    languages,
    learningTimes,
    openQuestions
  } = cardData;

  return (
    <div className="user-card-container">
      {/* Chavruta Preference Section */}
      <LabelValueSection 
        title="Chavruta Preference" 
        items={chavrutaPreference}
        icon={<User size={20} />}
        isEditMode={false}
        onItemChange={() => {}}
        onItemAdd={() => {}}
        showAddButton={true}
      />

      {/* Extra Details Section */}
      <LabelValueSection 
        title="Extra Details" 
        items={extraDetails}
        icon={<BookOpen size={20} />}
        isEditMode={false}
        onItemChange={() => {}}
        onItemAdd={() => {}}
        showAddButton={true}
      />

      {/* Languages Section */}
      <LabelValueSection 
        title="Languages" 
        items={languages}
        icon={<Globe size={20} />}
        isEditMode={false}
        onItemChange={() => {}}
        onItemRemove={() => {}}
        onItemAdd={() => {}}
        showAddButton={false}
      />

      {/* Learning Tracks Section */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><BookOpen size={20} /></div>
          <h3 className="section-title">Learning Tracks</h3>
          {false && (
            <button 
              className="add-track-button"
              onClick={() => setShowTrackSelector(!showTrackSelector)}
            >
              <Plus size={16} />
              Add Track
            </button>
          )}
        </div>
        <div className="tracks-container">
          {learningTracks.map((track, index) => (
            <span key={index} className="track-tag">
              {track}
              {false && (
                <button
                  className="remove-track-button"
                  onClick={() => {}}
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
        {showTrackSelector && (
          <div className="track-selector">
            {availableTracks
              .filter(track => !learningTracks.includes(track.trackEn))
              .map(track => (
                <button
                  key={track.id}
                  className="track-option"
                  onClick={() => {}}
                >
                  {track.trackEn}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Learning Times Section - Add toggles in edit mode */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><Calendar size={20} /></div>
          <h3 className="section-title">Learning Times</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="times-table">
            <thead>
              <tr>
                <th>Day</th>
                <th className="text-center">Morning</th>
                <th className="text-center">Afternoon</th>
                <th className="text-center">Evening</th>
              </tr>
            </thead>
            <tbody>
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].map((day) => (
                <tr key={day}>
                  <td className="capitalize">{day}</td>
                  {['morning', 'afternoon', 'evening'].map((slot) => (
                    <td 
                      key={slot} 
                      className="text-center"
                    >
                      <div className={`time-indicator ${
                        learningTimes[day][slot] ? 'available' : 'unavailable'
                      }`}>
                        {learningTimes[day][slot] ? '✓' : '×'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Only show Open Questions in view mode */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><MessageCircle size={20} /></div>
          <h3 className="section-title">Open Questions</h3>
        </div>
        <div className="questions-container">
          {openQuestions.map((q) => (
            <div key={q.id} className="question-item">
              <button
                onClick={() => toggleQuestion(q.id)}
                className="question-button"
              >
                <div className="question-header">
                  <span className="question-title">{q.question}</span>
                  <div className="question-icon">
                    {expandedQuestions.has(q.id) ? 
                      <ChevronUp size={20} /> : 
                      <ChevronDown size={20} />
                    }
                  </div>
                </div>
              </button>
              {expandedQuestions.has(q.id) && (
                <div className="question-answer">
                  {q.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
});

// Example usage with sample data
EditableLabelValue.displayName = 'EditableLabelValue';
LabelValueSection.displayName = 'LabelValueSection';
UserCard.displayName = 'UserCard';

export default UserCard;
