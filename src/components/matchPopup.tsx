import React, { useState, useEffect } from 'react';
import { Box, Text } from '@wix/design-system';
import { Check, X, ChevronDown, ChevronUp, Globe, User, BookOpen, MessageCircle, Calendar, Users } from 'lucide-react';
import '../styles/matches.css';
import './UserCard.css';

interface User {
  _id: string;
  fullName: string;
  country: string;
  gender: string;
  prefGender?: string;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  skillLevel?: number;
  desiredSkillLevel?: number;
  learningStyle?: number;
  prefTracks?: number[];
  utcOffset: string | number;
  openQuestions?: {
    question: string;
    answer: string;
  }[];
  sunday?: any;
  monday?: any;
  tuesday?: any;
  wednesday?: any;
  thursday?: any;
}

interface MatchPopupProps {
  israelUser: User;
  diasporaUser: User;
  onClose?: () => void;
}

import { 
  checkGenderCompatibility,
  checkEnglishLevelCompatibility,
  checkLearningSkillCompatibility,
  checkLearningStyleCompatibility,
  checkTrackCompatibility,
  calculateOverlappingHours,
  convertTimeSlotesToHours,
  convertHoursToTargetTimezone,
  findOverlappingHours,
  parseUtcOffset
} from '../data/matchLogic';

import { PreferredTracksInfo } from '../constants/tracks';
import { formatUserData, type ChavrutaCardProps } from '../data/formatters';

const MatchPopup: React.FC<MatchPopupProps> = ({ israelUser, diasporaUser, onClose }) => {
  const [israelUserData, setIsraelUserData] = useState<ChavrutaCardProps | null>(null);
  const [diasporaUserData, setDiasporaUserData] = useState<ChavrutaCardProps | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      const [israelData, diasporaData] = await Promise.all([
        formatUserData(israelUser),
        formatUserData(diasporaUser)
      ]);
      setIsraelUserData(israelData);
      setDiasporaUserData(diasporaData);
    };
    loadData();
  }, [israelUser, diasporaUser]);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const genderCompatible = checkGenderCompatibility(
    israelUser.gender,
    israelUser.prefGender,
    diasporaUser.gender,
    diasporaUser.prefGender
  );

  const englishCompatible = checkEnglishLevelCompatibility(israelUser, diasporaUser);
  const skillCompatible = checkLearningSkillCompatibility(israelUser, diasporaUser);
  const styleCompatible = checkLearningStyleCompatibility(israelUser, diasporaUser);
  const trackCompatible = checkTrackCompatibility(israelUser, diasporaUser);

  const getCommonTracks = () => {
    if (!israelUser.prefTracks || !diasporaUser.prefTracks) return [];
    
    const commonTrackIds = israelUser.prefTracks.filter(track => 
      diasporaUser.prefTracks?.includes(track)
    );
    
    return commonTrackIds.map(trackId => {
      const trackInfo = Object.values(PreferredTracksInfo).find(t => t.id === trackId);
      return trackInfo?.trackEn || `Track ${trackId}`;
    });
  };

  const getOverlappingTimeSlots = () => {
    const sourceOffset = parseUtcOffset(israelUser.utcOffset);
    const pairOffset = parseUtcOffset(diasporaUser.utcOffset);
    const timezoneOffset = pairOffset - sourceOffset;

    const israelHours = convertTimeSlotesToHours(israelUser);
    const diasporaHours = convertTimeSlotesToHours(diasporaUser);
    const israelHoursInDiasporaTimezone = convertHoursToTargetTimezone(israelHours, timezoneOffset);
    const overlappingHours = findOverlappingHours(israelHoursInDiasporaTimezone, diasporaHours);

    const timeSlotRanges = {
      morning: { start: 5, end: 12 },
      noon: { start: 12, end: 15 },
      evening: { start: 15, end: 21 },
      lateNight: { start: 21, end: 26 }
    };

    const result: Record<string, Record<string, boolean>> = {};
    
    for (const [day, hours] of Object.entries(overlappingHours)) {
      result[day] = {
        morning: false,
        noon: false,
        evening: false,
        lateNight: false
      };

      for (const hour of hours) {
        for (const [slot, range] of Object.entries(timeSlotRanges)) {
          if (hour >= range.start && hour < range.end) {
            result[day][slot] = true;
          }
        }
      }
    }

    return result;
  };

  const CompatibilityIcon = ({ isCompatible }: { isCompatible: boolean }) => (
    <div className="match-popup-compatibility-icon">
      {isCompatible ? (
        <Check size={20} style={{ color: '#4CAF50' }} />
      ) : (
        <X size={20} style={{ color: '#F44336' }} />
      )}
    </div>
  );

  const UserSection = ({ userData, title }: { userData: ChavrutaCardProps | null; title: string }) => {
    if (!userData) return <div>Loading...</div>;

    const { chavrutaPreference, extraDetails, languages, learningTracks, learningTimes, openQuestions } = userData;

    return (
      <div className="user-card-container match-popup-user-container">
        <div className="card-section match-popup-section">
          <div className="section-header match-popup-section-header">
            <div className="section-icon"><User size={18} /></div>
            <h3 className="section-title match-popup-section-title">{title}</h3>
          </div>
          <div className="match-popup-label-value-column">
            {chavrutaPreference.map((item, index) => (
              <div key={index} className="label-value-item match-popup-label-value-item">
                <span className="item-label match-popup-label">{item.label}:</span>
                <span className="item-value match-popup-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-section match-popup-section">
          <div className="section-header match-popup-section-header">
            <div className="section-icon"><BookOpen size={18} /></div>
            <h3 className="section-title match-popup-section-title">Extra Details</h3>
          </div>
          <div className="match-popup-label-value-column">
            {extraDetails.map((item, index) => (
              <div key={index} className="label-value-item match-popup-label-value-item">
                <span className="item-label match-popup-label">{item.label}:</span>
                <span className="item-value match-popup-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-section match-popup-section">
          <div className="section-header match-popup-section-header">
            <div className="section-icon"><Globe size={18} /></div>
            <h3 className="section-title match-popup-section-title">Languages</h3>
          </div>
          <div className="match-popup-label-value-column">
            {languages.map((item, index) => (
              <div key={index} className="label-value-item match-popup-label-value-item">
                <span className="item-label match-popup-label">{item.label}:</span>
                <span className="item-value match-popup-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-section match-popup-section">
          <div className="section-header match-popup-section-header">
            <div className="section-icon"><BookOpen size={18} /></div>
            <h3 className="section-title match-popup-section-title">Learning Tracks</h3>
          </div>
          <div className="tracks-container match-popup-tracks-container">
            {learningTracks?.map((track) => (
              <span key={track.id} className="track-tag match-popup-track-tag">
                {track.trackEn}
              </span>
            ))}
          </div>
        </div>

        <div className="card-section match-popup-section">
          <div className="section-header match-popup-section-header">
            <div className="section-icon"><MessageCircle size={18} /></div>
            <h3 className="section-title match-popup-section-title">Open Questions</h3>
          </div>
          <div className="questions-container">
            {openQuestions.map((q) => (
              <div key={q.id} className="question-item match-popup-question-item">
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="question-button match-popup-question-button"
                >
                  <div className="question-header">
                    <span className="question-title match-popup-question-title">{q.question}</span>
                    <div className="question-icon match-popup-question-icon">
                      {expandedQuestions.has(q.id) ? 
                        <ChevronUp size={18} /> : 
                        <ChevronDown size={18} />
                      }
                    </div>
                  </div>
                </button>
                {expandedQuestions.has(q.id) && (
                  <div className="question-answer match-popup-question-answer">
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

  const commonTracks = getCommonTracks();
  const overlappingTimeSlots = getOverlappingTimeSlots();
  const totalOverlappingHours = calculateOverlappingHours(israelUser, diasporaUser);

  return (
    <div className="match-popup-container">
      <div className="match-popup-grid">
        
        {/* Left Side - Israel User */}
        <div className="match-popup-column">
          <UserSection userData={israelUserData} title={`${israelUser.fullName} (Israel)`} />
        </div>

        {/* Middle - Compatibility Information */}
        <div className="match-popup-column">
          <div className="user-card-container match-popup-user-container">
            
            {/* Compatibility Checks */}
            <div className="card-section match-popup-times-section">
              <div className="section-header match-popup-times-header">
                <div className="section-icon"><Users size={18} /></div>
                <h3 className="section-title match-popup-section-title">Compatibility Analysis</h3>
              </div>
              <div className="match-popup-label-value-column">
                <div className="label-value-item match-popup-compatibility-row">
                  <span className="item-label match-popup-compatibility-label">Gender:</span>
                  <span className="item-value match-popup-compatibility-value">
                    {genderCompatible ? 'Compatible' : 'Not Compatible'}
                    <CompatibilityIcon isCompatible={genderCompatible} />
                  </span>
                </div>
                <div className="label-value-item match-popup-compatibility-row">
                  <span className="item-label match-popup-compatibility-label">English Level:</span>
                  <span className="item-value match-popup-compatibility-value">
                    {englishCompatible ? 'Compatible' : 'Not Compatible'}
                    <CompatibilityIcon isCompatible={englishCompatible} />
                  </span>
                </div>
                <div className="label-value-item match-popup-compatibility-row">
                  <span className="item-label match-popup-compatibility-label">Learning Skill:</span>
                  <span className="item-value match-popup-compatibility-value">
                    {skillCompatible ? 'Compatible' : 'Not Compatible'}
                    <CompatibilityIcon isCompatible={skillCompatible} />
                  </span>
                </div>
                <div className="label-value-item match-popup-compatibility-row">
                  <span className="item-label match-popup-compatibility-label">Learning Style:</span>
                  <span className="item-value match-popup-compatibility-value">
                    {styleCompatible ? 'Compatible' : 'Not Compatible'}
                    <CompatibilityIcon isCompatible={styleCompatible} />
                  </span>
                </div>
              </div>
            </div>

            {/* Common Tracks */}
            <div className="card-section match-popup-times-section">
              <div className="section-header match-popup-times-header">
                <div className="section-icon"><BookOpen size={18} /></div>
                <h3 className="section-title match-popup-section-title">Common Tracks</h3>
                <CompatibilityIcon isCompatible={trackCompatible} />
              </div>
              <div className="tracks-container match-popup-tracks-container">
                {commonTracks.length > 0 ? (
                  commonTracks.map((track, index) => (
                    <span key={index} className="track-tag match-popup-track-tag">
                      {track}
                    </span>
                  ))
                ) : (
                  <span className="item-value match-popup-value">No common tracks</span>
                )}
              </div>
            </div>

            {/* Overlapping Times */}
            <div className="card-section match-popup-times-section">
              <div className="section-header match-popup-times-header">
                <div className="section-icon"><Calendar size={18} /></div>
                <h3 className="section-title match-popup-section-title">Overlapping Learning Times</h3>
                <CompatibilityIcon isCompatible={totalOverlappingHours > 0} />
              </div>
              <div className="match-popup-times-details">
                <div className="label-value-item match-popup-times-row">
                  <span className="item-label match-popup-label">Total Hours:</span>
                  <span className="item-value match-popup-value">{totalOverlappingHours} hours</span>
                </div>
              </div>
              {Object.keys(overlappingTimeSlots).length > 0 && (
                <div className="match-popup-times-table-container">
                  <table className="times-table match-popup-times-table">
                    <thead>
                      <tr>
                        <th style={{ width: '75px' }}>Day</th>
                        <th style={{ textAlign: 'center', width: '65px' }}>Morning</th>
                        <th style={{ textAlign: 'center', width: '65px' }}>Noon</th>
                        <th style={{ textAlign: 'center', width: '65px' }}>Evening</th>
                        <th style={{ textAlign: 'center', width: '75px' }}>Late Night</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].map((day) => {
                        const daySlots = overlappingTimeSlots[day];
                        if (!daySlots) return null;
                        
                        return (
                          <tr key={day}>
                            <td className="day-cell">{day}</td>
                            {['morning', 'noon', 'evening', 'lateNight'].map((slot) => (
                              <td key={slot} className="time-cell">
                                <div className={`time-indicator match-popup-time-indicator ${
                                  daySlots[slot] ? 'available' : 'unavailable'
                                }`}>
                                  {daySlots[slot] ? '✓' : '×'}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side - Diaspora User */}
        <div className="match-popup-column">
          <UserSection userData={diasporaUserData} title={`${diasporaUser.fullName} (Diaspora)`} />
        </div>

      </div>
    </div>
  );
};

export default MatchPopup;