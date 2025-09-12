import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { Globe, BookOpen, Calendar, User, Plus } from 'lucide-react';
import { PreferredTracksInfo } from '../constants/tracks';
import { 
  initializeFormData, 
  initializeFormLearningTimes, 
  convertLearningTimesToServerFormat,
  LearningTimes,
  EnglishLevels,
  SkillLevels,
  LearningStyles
} from '../data/formatters';
import './UserCard.css';

interface EditUserFormProps {
  user: Record<string, any>;
  onChange: (updatedUser: Record<string, any>) => void;
}

// Add these missing constants
const genderOptions = ['male', 'female', 'other'];
const genderPrefOptions = ['male', 'female', 'no preference'];
const chavrutaCountOptions = ['1', '2', '3', 'more than 3'];

// Define the missing weekdays and timeSlots
const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;

// Define the types
type Weekday = typeof weekdays[number];
type TimeSlot = typeof timeSlots[number];

// Define the FormData interface
interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  learningTracks: string[];
  prefTracks: string[];
  prefNumberOfMatches: string;
  country: string;
  skillLevel: string;
  englishLevel: string;
  learningStyle: string;
  prefGender: string;
  otherLanguages: string; // Add this field
  learningTimes: LearningTimes;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onChange }) => {
  // Add debugging to see what's happening
  console.log("Raw user data in EditUserForm:", user);
  console.log("User gender:", user.gender);
  console.log("User prefGender:", user.prefGender);

  // Use the helper function to initialize form data
  const [formData, setFormData] = useState(() => {
    const initialData = initializeFormData(user);
    console.log("Initial form data:", initialData);
    
    // Add server format for each day
    const serverTimeData = convertLearningTimesToServerFormat(initialData.learningTimes);
    
    // Handle gender fields specifically if they're not working
    const genderValue = Array.isArray(user.gender) ? user.gender[0] || '' : (user.gender || '');
    const prefGenderValue = Array.isArray(user.prefGender) ? user.prefGender[0] || '' : (user.prefGender || '');
    
    console.log("Direct gender handling:", { genderValue, prefGenderValue });
    
    return {
      ...initialData,
      ...serverTimeData,
      // Override gender fields if needed
      gender: genderValue,
      prefGender: prefGenderValue,
    };
  });

  // Add debugging to see current form state
  console.log("Current formData:", formData);
  console.log("Current formData.gender:", formData.gender);
  console.log("Current formData.prefGender:", formData.prefGender);

  const [showTrackSelector, setShowTrackSelector] = useState(false);

  // Helper function to convert string value back to index
  const convertValueToIndex = (value: string, array: string[]): number => {
    const index = array.indexOf(value);
    return index === -1 ? 0 : index;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value // Keep the display value for the UI
      };

      // Convert certain fields back to numeric indices for server format
      const isIsraeli = prev.country === 'Israel';
      
      // Add server format fields
      const serverData = {
        ...newData,
        // Convert gender back to array format if needed
        ...(field === 'gender' && {
          gender: [value] // Convert back to array format
        }),
        // Convert prefGender back to array format if needed
        ...(field === 'prefGender' && {
          prefGender: [value] // Convert back to array format
        }),
        // Convert skill level back to index - use different field names
        ...(field === 'skillLevel' && {
          // Store index in the correct server field
          ...(isIsraeli 
            ? { desiredSkillLevel: convertValueToIndex(value, SkillLevels) }
            : { skillLevelIndex: convertValueToIndex(value, SkillLevels) }
          )
        }),
        // Convert English level back to index - use different field names
        ...(field === 'englishLevel' && {
          // Store index in the correct server field
          ...(isIsraeli 
            ? { englishLevelIndex: convertValueToIndex(value, EnglishLevels) }
            : { desiredEnglishLevel: convertValueToIndex(value, EnglishLevels) }
          )
        }),
        // Convert learning style back to index
        ...(field === 'learningStyle' && {
          prefLearningStyle: convertValueToIndex(value, LearningStyles)
        })
      };

      return serverData;
    });
  };

  // Create a debounced version of onChange
  const debouncedOnChange = useCallback(
    debounce((newData: FormData & Record<string, any>) => {
      onChange(newData);
    }, 500), // Wait 500ms after the last change before calling onChange
    [onChange]
  );

  // Update useEffect to use debounced function
  useEffect(() => {
    debouncedOnChange(formData);
    
    // Cleanup function to cancel any pending debounced calls
    return () => {
      debouncedOnChange.cancel();
    };
  }, [formData, debouncedOnChange]);

  // Convert the time slots to the format that the server expects
  const handleTimeSlotToggle = (day: Weekday, slot: TimeSlot) => {
    setFormData(prev => {
      const newTimes = {
        ...prev.learningTimes,
        [day]: {
          ...prev.learningTimes[day],
          [slot]: !prev.learningTimes[day][slot]
        }
      } as LearningTimes;

      // Use the helper function to convert to server format
      const serverTimeData = convertLearningTimesToServerFormat(newTimes);

      return {
        ...prev,
        learningTimes: newTimes,
        ...serverTimeData
      };
    });
  };

  // Memoize track rendering
  const TrackList = React.memo(({ tracks, onRemove }: { 
    tracks: string[], 
    onRemove: (id: string) => void 
  }) => (
    <div className="tracks-container">
      {tracks.map((trackId) => {
        const track = Object.values(PreferredTracksInfo).find(t => t.id === trackId);
        return track ? (
          <span key={track.id} className="track-tag">
            {track.trackEn}
            <button
              className="remove-track-button"
              onClick={() => onRemove(track.id!)}
            >
              ×
            </button>
          </span>
        ) : null;
      })}
    </div>
  ));

  return (
    <div className="user-card-container">
      {/* Personal Details Section */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><User size={20} /></div>
          <h3 className="section-title">Personal Details</h3>
        </div>
        <div className="label-value-grid">
          <div className="label-value-item">
            <span className="item-label">Full Name:</span>
            <input
              type="text"
              className="editable-value"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">Email:</span>
            <input
              type="email"
              className="editable-value"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">Phone:</span>
            <input
              type="tel"
              className="editable-value"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">Gender:</span>
            <select
              className="editable-value"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              {genderOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="label-value-item">
            <span className="item-label">Country:</span>
            <input
              type="text"
              className="editable-value"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">Other Languages:</span>
            <input
              type="text"
              className="editable-value"
              value={formData.otherLanguages}
              onChange={(e) => handleInputChange('otherLanguages', e.target.value)}
              placeholder="Enter other languages spoken"
            />
          </div>
        </div>
      </div>

      {/* Learning Preferences Section */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><BookOpen size={20} /></div>
          <h3 className="section-title">Learning Preferences</h3>
        </div>
        <div className="label-value-grid">
          <div className="label-value-item">
            <span className="item-label">
              {user.country === 'Israel' ? 'Desired Learning Skill' : 'Learning Skill'}:
            </span>
            <select
              className="editable-value"
              value={formData.skillLevel}
              onChange={(e) => handleInputChange('skillLevel', e.target.value)}
            >
              <option value="">Select skill level</option>
              {SkillLevels.map((level, index) => (
                <option key={index} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="label-value-item">
            <span className="item-label">
              {user.country === 'Israel' ? 'English Level' : 'Desired English Level'}:
            </span>
            <select
              className="editable-value"
              value={formData.englishLevel}
              onChange={(e) => handleInputChange('englishLevel', e.target.value)}
            >
              <option value="">Select English level</option>
              {EnglishLevels.map((level, index) => (
                <option key={index} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="label-value-item">
            <span className="item-label">Learning Style:</span>
            <select
              className="editable-value"
              value={formData.learningStyle}
              onChange={(e) => handleInputChange('learningStyle', e.target.value)}
            >
              <option value="">Select learning style</option>
              {LearningStyles.map((style, index) => (
                <option key={index} value={style}>{style}</option>
              ))}
            </select>
          </div>
          <div className="label-value-item">
            <span className="item-label">Preferred Gender:</span>
            <select
              className="editable-value"
              value={formData.prefGender}
              onChange={(e) => handleInputChange('prefGender', e.target.value)}
            >
              <option value="">Select preference</option>
              {genderPrefOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="label-value-item">
            <span className="item-label">Number of Chavrutas:</span>
            <select
              className="editable-value"
              value={formData.prefNumberOfMatches}
              onChange={(e) => handleInputChange('prefNumberOfMatches', e.target.value)}
            >
              <option value="">Select number</option>
              {chavrutaCountOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Learning Tracks Section */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-icon"><BookOpen size={20} /></div>
          <h3 className="section-title">Learning Tracks</h3>
          <button 
            className="add-track-button"
            onClick={() => setShowTrackSelector(!showTrackSelector)}
          >
            <Plus size={16} />
            <span>Add Track</span>
          </button>
        </div>
        <TrackList 
        tracks={formData.prefTracks} 
        onRemove={(id) => {
          const newTracks = formData.prefTracks.filter(trackId => trackId !== id);
          setFormData(prev => ({
            ...prev,
            prefTracks: newTracks,
             // Update both the UI state and server format
          }));
        }} />
        {showTrackSelector && (
          <div className="track-selector">
            {Object.values(PreferredTracksInfo)
              .filter(track => track.id && !formData.prefTracks.includes(track.id))
              .map(track => (
                <button
                  key={track.id}
                  className="track-option"
                  onClick={() => {
                    const newTracks = [...formData.prefTracks, track.id!];
                    setFormData(prev => ({
                      ...prev,
                      learningTracks: newTracks,
                      prefTracks: newTracks // Fixed: was "prefTra"
                    }));
                    setShowTrackSelector(false);
                  }}
                >
                  {track.trackEn}
                </button>
              ))}
          </div>
        )}
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
                <th className="text-center">Noon</th>
                <th className="text-center">Evening</th>
                <th className="text-center">Late Night</th>
              </tr>
            </thead>
            <tbody>
              {weekdays.map((day) => (
                <tr key={day}>
                  <td className="capitalize">{day}</td>
                  {timeSlots.map((slot) => (
                    <td 
                      key={slot} 
                      className="text-center"
                      onClick={() => handleTimeSlotToggle(day, slot)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`time-indicator ${
                        formData.learningTimes[day][slot] ? 'available' : 'unavailable'
                      }`}>
                        {formData.learningTimes[day][slot] ? '✓' : '×'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;