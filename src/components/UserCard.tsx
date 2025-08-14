import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, Globe, User, BookOpen, MessageCircle, Calendar } from 'lucide-react';
import './UserCard.css';
import { getTracks } from '../data/cmsData';

interface LabelValuePair {
  label: string;
  value: string | number;
}

interface Question {
  id: string;
  question: string;
  answer: string;
}

interface LearningTime {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

interface LearningTimes {
  sunday: LearningTime;
  monday: LearningTime;
  tuesday: LearningTime;
  wednesday: LearningTime;
  thursday: LearningTime;
}



interface ChavrutaCardProps {
  chavrutaPreference: LabelValuePair[];
  extraDetails: LabelValuePair[];
  learningTracks: string[];
  languages: LabelValuePair[];
  learningTimes: LearningTimes;
  openQuestions: Question[];
}

interface UserCardProps {
  user: Record<string, any>;
}

// Helper function to format the raw user data
export async function formatUserData(rawUser: Record<string, any>): ChavrutaCardProps {
    console.log("Formatting user data:", rawUser);
  const checkTimeSlot = (dayValue: any, slot: string) => {
    // If dayValue is null/undefined or not an array, return false
    if (!dayValue || !Array.isArray(dayValue)) {
      return false;
    }
    // Only check includes if we have a valid array
    return dayValue.includes(slot) || false;
  };

  const learningTimes: LearningTimes = {
    sunday: {
      morning: checkTimeSlot(rawUser?.sunday, "Morning"),
      afternoon: checkTimeSlot(rawUser?.sunday, "Noon"),
      evening: checkTimeSlot(rawUser?.sunday, "Evening"),
    },
    monday: {
      morning: checkTimeSlot(rawUser?.monday, "Morning"),
      afternoon: checkTimeSlot(rawUser?.monday, "Noon"),
      evening: checkTimeSlot(rawUser?.monday, "Evening"),
    },
    tuesday: {
      morning: checkTimeSlot(rawUser?.tuesday, "Morning"),
      afternoon: checkTimeSlot(rawUser?.tuesday, "Noon"),
      evening: checkTimeSlot(rawUser?.tuesday, "Evening"),
    },
    wednesday: {
      morning: checkTimeSlot(rawUser?.wednesday, "Morning"),
      afternoon: checkTimeSlot(rawUser?.wednesday, "Noon"),
      evening: checkTimeSlot(rawUser?.wednesday, "Evening"),
    },
    thursday: {
      morning: checkTimeSlot(rawUser?.thursday, "Morning"),
      afternoon: checkTimeSlot(rawUser?.thursday, "Noon"),
      evening: checkTimeSlot(rawUser?.thursday, "Evening"),
    },
  };

  const formatName = () => {
    if (rawUser.fullName?.trim()) return rawUser.fullName;
    const fName = rawUser.fName?.trim() || '';
    const lName = rawUser.lName?.trim() || '';
    return fName || lName ? `${fName} ${lName}`.trim() : 'Not specified';
  };

  const formatLocation = () => {
    const city = rawUser.city?.trim() || '';
    const country = rawUser.country?.trim() || '';
    if (!city && !country) return 'Not specified';
    if (!city) return country;
    if (!country) return city;
    return `${city}, ${country}`;
  };
  const formatField = (value: any) => {
    if (!value) return 'Not specified';
    const strValue = String(value).trim();
    return strValue || 'Not specified';
  };

  const chavrutaPreference: LabelValuePair[] = [
   
    { label: 'Gender Preference', value: rawUser.menOrWomen?.trim() || 'No preference' },
    { label: 'Learning Style', value: formatField(rawUser.learningStyle) },
    { label: 'More Than One Chavruta', value: formatField(rawUser.moreThanOneChavruta) },
    { label: 'Learning Skill', value: formatField(rawUser.learningSkill) },
  ];

  const extraDetails: LabelValuePair[] = [
     { label: 'Gender', value: rawUser.gender?.trim() || 'Not specified' },
        { label: 'Location', value: formatLocation() },
    { label: 'Jewish Affiliation', value: formatField(rawUser.jewishAndComAff) },
    { label: 'Profession', value: formatField(rawUser.profession) }
  ];

  const languages: LabelValuePair[] = [
    ...(Array.isArray(rawUser.otherLan) && rawUser.otherLan.length > 0
      ? rawUser.otherLan
          .filter((lang: string | null) => lang && lang.trim())
          .map((lang: string) => ({ label:'Additional Language', value:  lang.trim()}))
      : [])
  ];

  const formatArrayResponse = (arr: any[] | null | undefined) => {
    if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
    return arr
      .filter(item => item && String(item).trim())
      .join('\n') || 'None provided';
  };

  const openQuestions: Question[] = [
    {
      id: '1',
      question: 'Background',
      answer: formatField(rawUser.background)
    },
    {
      id: '2',
      question: 'Experience',
      answer: formatField(rawUser.experience)
    },
    {
      id: '3',
      question: 'Requests',
      answer: formatField(rawUser.requests)
    },
    {
      id: '4',
      question: 'Who Introduced You?',
      answer: formatField(rawUser.whoIntroduced)
    },
    {
      id: '5',
      question: 'Hopes and Expectations',
      answer: formatArrayResponse(rawUser.hopesExpectations)
    },
    {
      id: '6',
      question: 'Additional Information',
      answer: formatField(rawUser.additionalInfo)
    },
    {
      id: '7',
      question: 'Anything Else',
      answer: formatField(rawUser.anythingElse)
    }
  ];

  const formatTrackNames = async (trackIds: string[] = []) => {
    if (!Array.isArray(trackIds) || trackIds.length === 0) return [];
    
    const tracks = await getTracks();
    return trackIds
      .map(id => tracks.find(track => track.id === id)?.trackEn)
      .filter((name): name is string => !!name); // filter out undefined and null values
  };

  // Get the track names from the prefTra field
  const trackNames = await formatTrackNames(Array.isArray(rawUser.prefTra) ? rawUser.prefTra : []);

  return {
    chavrutaPreference,
    extraDetails,
    learningTracks: trackNames,
    languages,
    learningTimes,
    openQuestions
  };
}

const UserCard: React.FC<UserCardProps> = ({ user, ...props }) => {
  const [cardData, setCardData] = useState<ChavrutaCardProps | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      const data = await formatUserData(user);
      setCardData(data);
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

  const LabelValueSection: React.FC<{ 
    title: string; 
    items: LabelValuePair[]; 
    icon: React.ReactNode 
  }> = ({ title, items, icon }) => (
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
  );

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
  const timeSlots = ['morning', 'afternoon', 'evening'] as const;

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
      />

      {/* Extra Details Section */}
      <LabelValueSection 
        title="Extra Details" 
        items={extraDetails}
        icon={<BookOpen size={20} />}
      />

      {/* Languages Section */}
      <LabelValueSection 
        title="Languages" 
        items={languages}
        icon={<Globe size={20} />}
      />

      {/* Learning Tracks Section */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><BookOpen size={20} /></div>
          <h3 className="section-title">Learning Tracks</h3>
        </div>
        <div className="tracks-container">
          {learningTracks.map((track, index) => (
            <span key={index} className="track-tag">
              {track}
            </span>
          ))}
        </div>
      </div>

      {/* Learning Times Section */}
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
              {weekdays.map((day) => (
                <tr key={day}>
                  <td className="capitalize">{day}</td>
                  {timeSlots.map((slot) => (
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

      {/* Open Questions Section */}
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
};

// Example usage with sample data


export default UserCard;