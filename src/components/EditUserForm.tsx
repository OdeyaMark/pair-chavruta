import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { Globe, BookOpen, Calendar, User, Plus } from 'lucide-react';
import { getTracks } from '../data/cmsData';
import './UserCard.css';

interface EditUserFormProps {
  user: Record<string, any>;
  onChange: (updatedUser: Record<string, any>) => void;
}

interface FormData {
  fullName: string;
  email: string;
  tel: string;
  gender: string;
  learningTracks: string[];
  moreThanOneChavruta: string;
  country: string;
  learningSkill: string;
  levOfEn: string;
  learningStyle: string;
  menOrWomen: string;
  learningTimes: LearningTimes;
}

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
type Weekday = typeof weekdays[number];

const timeSlots = ['morning', 'afternoon', 'evening'] as const;
type TimeSlot = typeof timeSlots[number];

type DayTimeSlots = {
  [key in TimeSlot]: boolean;
};

type LearningTimes = {
  [key in Weekday]: DayTimeSlots;
};

const genderOptions = ['Male', 'Female', 'Other'];
const learningSkillOptions = ['Beginner', 'Intermediate', 'Advanced'];
const englishLevelOptions = ['Basic', 'Good', 'Excellent'];
const learningStyleOptions = ['Structured', 'Flexible', 'No significant style'];
const genderPrefOptions = ['Male', 'Female', 'No preference'];
const chavrutaCountOptions = ['1', '2', '3', 'More than 3'];

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onChange }) => {
  // Initialize form data with both the UI state and the server format
  const initializeLearningTimes = (): LearningTimes => {
    return weekdays.reduce((acc, day) => ({
      ...acc,
      [day]: {
        morning: user[day]?.includes('Morning') || false,
        afternoon: user[day]?.includes('Noon') || false,
        evening: user[day]?.includes('Evening') || false,
      }
    }), {} as LearningTimes);
  };

  const [formData, setFormData] = useState<FormData & Record<string, any>>({
    fullName: user.fullName || '',
    email: user.email || '',
    tel: user.tel || '',
    gender: user.gender || '',
    learningTracks: user.prefTra || [],
    moreThanOneChavruta: user.moreThanOneChavruta || '1',
    country: user.country || '',
    learningSkill: user.learningSkill || '',
    levOfEn: user.levOfEn || '',
    learningStyle: user.learningStyle || '',
    menOrWomen: user.menOrWomen || '',
    learningTimes: initializeLearningTimes(),
    // Add the server format for each day
    ...weekdays.reduce((acc, day) => ({
      ...acc,
      [day]: (user[day] || []).filter(Boolean)
    }), {} as Record<Weekday, string[]>)
  });

  const [availableTracks, setAvailableTracks] = useState<{ id: string; trackEn: string; }[]>([]);
  const [showTrackSelector, setShowTrackSelector] = useState(false);

  useEffect(() => {
    const loadTracks = async () => {
      const tracks = await getTracks();
      setAvailableTracks(tracks);
    };
    loadTracks();
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    const slotMap: Record<TimeSlot, string> = {
      'morning': 'Morning',
      'afternoon': 'Noon',
      'evening': 'Evening'
    };

    setFormData(prev => {
      const newTimes = {
        ...prev.learningTimes,
        [day]: {
          ...prev.learningTimes[day],
          [slot]: !prev.learningTimes[day][slot]
        }
      } as LearningTimes;

      // For each day, convert boolean time slots to array format for the server
      const dayArray = (Object.entries(newTimes[day]) as [TimeSlot, boolean][])
        .filter(([_, isSelected]) => isSelected)
        .map(([timeSlot]) => slotMap[timeSlot]);

      return {
        ...prev,
        learningTimes: newTimes,
        [day]: dayArray // This adds the day's array directly to formData
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
        const track = availableTracks.find(t => t.id === trackId);
        return track ? (
          <span key={track.id} className="track-tag">
            {track.trackEn}
            <button
              className="remove-track-button"
              onClick={() => onRemove(track.id)}
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
              value={formData.tel}
              onChange={(e) => handleInputChange('tel', e.target.value)}
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
            <span className="item-label">Learning Stage:</span>
            <input
              type="text"
              className="editable-value"
              value={formData.learningSkill}
              onChange={(e) => handleInputChange('learningSkill', e.target.value)}
              placeholder="Enter learning stage"
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">English Level:</span>
            <input
              type="text"
              className="editable-value"
              value={formData.levOfEn}
              onChange={(e) => handleInputChange('levOfEn', e.target.value)}
              placeholder="Enter English level"
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">Learning Style:</span>
            <input
              type="text"
              className="editable-value"
              value={formData.learningStyle}
              onChange={(e) => handleInputChange('learningStyle', e.target.value)}
              placeholder="Enter learning style"
            />
          </div>
          <div className="label-value-item">
            <span className="item-label">Preferred Gender:</span>
            <select
              className="editable-value"
              value={formData.menOrWomen}
              onChange={(e) => handleInputChange('menOrWomen', e.target.value)}
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
              value={formData.moreThanOneChavruta}
              onChange={(e) => handleInputChange('moreThanOneChavruta', e.target.value)}
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
        tracks={formData.learningTracks} 
        onRemove={(id) => {
          const newTracks = formData.learningTracks.filter(trackId => trackId !== id);
          setFormData(prev => ({
            ...prev,
            learningTracks: newTracks,
            prefTra: newTracks // Update both the UI state and server format
          }));
        }} />
        {showTrackSelector && (
          <div className="track-selector">
            {availableTracks
              .filter(track => !formData.learningTracks.includes(track.id))
              .map(track => (
                <button
                  key={track.id}
                  className="track-option"
                  onClick={() => {
                    const newTracks = [...formData.learningTracks, track.id];
                    setFormData(prev => ({
                      ...prev,
                      learningTracks: newTracks,
                      prefTra: newTracks // Update both the UI state and server format
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

      {/* Learning Times Section - Reusing existing code */}
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