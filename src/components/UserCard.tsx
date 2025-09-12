import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Globe, User, BookOpen, MessageCircle, Calendar } from 'lucide-react';
import './UserCard.css';
import { 
  formatUserData, 
  type ChavrutaCardProps, 
  type LabelValuePair, 
  type Question, 
  type LearningTimes 
} from '../data/formatters';

const LabelValueSection = React.memo<{ 
  title: string; 
  items: LabelValuePair[]; 
  icon: React.ReactNode;
}>(({ title, items, icon }) => (
  <div className="card-section">
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <h3 className="section-title">{title}</h3>
    </div>
    <div className="label-value-grid">
      {items.map((item, index) => (
        <div key={index} className="label-value-item">
          <span className="item-label">{item.label}:</span>
          <span className="item-value">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
));

const UserCard = React.memo<UserCardProps>(({ user }) => {
  const [cardData, setCardData] = useState<ChavrutaCardProps | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      const data = await formatUserData(user);
      setCardData(data);
      console.log("formatted data", data);
    };
    loadData();
  }, [user]);

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
      <LabelValueSection 
        title="Chavruta Preference" 
        items={chavrutaPreference}
        icon={<User size={20} />}
      />

      <LabelValueSection 
        title="Extra Details" 
        items={extraDetails}
        icon={<BookOpen size={20} />}
      />

      <LabelValueSection 
        title="Languages" 
        items={languages}
        icon={<Globe size={20} />}
      />

      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><BookOpen size={20} /></div>
          <h3 className="section-title">Learning Tracks</h3>
        </div>
        <div className="tracks-container">
          {learningTracks?.map((track) => (
            <span key={track.id} className="track-tag">
              {track.trackEn}
            </span>
          ))}
        </div>
      </div>

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
                <th className="text-center">Noon</th>
                <th className="text-center">Evening</th>
                <th className="text-center">Late Night</th>
              </tr>
            </thead>
            <tbody>
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].map((day) => (
                <tr key={day}>
                  <td className="capitalize">{day}</td>
                  {['morning', 'noon', 'evening', 'lateNight'].map((slot) => (
                    <td key={slot} className="text-center">
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

LabelValueSection.displayName = 'LabelValueSection';
UserCard.displayName = 'UserCard';

export default UserCard;
