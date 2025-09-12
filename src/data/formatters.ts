import { PreferredTracksInfo } from "../constants/tracks";


export interface LabelValuePair {
  label: string;
  value: string | number;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
}

export interface LearningTime {
  morning: boolean;
  noon: boolean;      // Add this
  evening: boolean;
  lateNight: boolean; }

export interface LearningTimes {
  sunday: LearningTime;
  monday: LearningTime;
  tuesday: LearningTime;
  wednesday: LearningTime;
  thursday: LearningTime;
}

interface TrackInfo {
    id: string;
    trackEn: string;
  }

export interface ChavrutaCardProps {
  chavrutaPreference: LabelValuePair[];
  extraDetails: LabelValuePair[];
  learningTracks: TrackInfo[];
  languages: LabelValuePair[];
  learningTimes: LearningTimes;
  openQuestions: Question[];
}

export const EnglishLevels = ["Doesn't have to be perfect. I know some Hebrew", "Conversational level", "Excellent (I don't know any Hebrew whatsoever)", "not specified"];
export const SkillLevels = ["Beginner", "Moderate", "Advanced", "not specified"];
export const LearningStyles = ["Deep and Slow", "Progressed, flowing", "Text centered", "Philosophical, free talking, deriving from text into thought", "No significant or particular style"];
// Helper functions
const checkTimeSlot = (dayValue: any, slot: string) => {
  if (!dayValue || !Array.isArray(dayValue)) {
    return false;
  }
  return dayValue.includes(slot) || false;
};


// Main formatting function
export async function formatUserData(rawUser: Record<string, any>): ChavrutaCardProps {

  const learningTimes: LearningTimes = {
    sunday: {
      morning: checkTimeSlot(rawUser?.sunday, "Morning"),
      noon: checkTimeSlot(rawUser?.sunday, "Noon"), // Changed from afternoon to noon
      evening: checkTimeSlot(rawUser?.sunday, "Evening"),
      lateNight: checkTimeSlot(rawUser?.sunday, "Late Night"), // Added lateNight
    },
    monday: {
      morning: checkTimeSlot(rawUser?.monday, "Morning"),
      noon: checkTimeSlot(rawUser?.monday, "Noon"), // Changed from afternoon to noon
      evening: checkTimeSlot(rawUser?.monday, "Evening"),
      lateNight: checkTimeSlot(rawUser?.monday, "Late Night"), // Added lateNight
    },
    tuesday: {
      morning: checkTimeSlot(rawUser?.tuesday, "Morning"),
      noon: checkTimeSlot(rawUser?.tuesday, "Noon"), // Changed from afternoon to noon
      evening: checkTimeSlot(rawUser?.tuesday, "Evening"),
      lateNight: checkTimeSlot(rawUser?.tuesday, "Late Night"), // Added lateNight
    },
    wednesday: {
      morning: checkTimeSlot(rawUser?.wednesday, "Morning"),
      noon: checkTimeSlot(rawUser?.wednesday, "Noon"), // Changed from afternoon to noon
      evening: checkTimeSlot(rawUser?.wednesday, "Evening"),
      lateNight: checkTimeSlot(rawUser?.wednesday, "Late Night"), // Added lateNight
    },
    thursday: {
      morning: checkTimeSlot(rawUser?.thursday, "Morning"),
      noon: checkTimeSlot(rawUser?.thursday, "Noon"), // Changed from afternoon to noon
      evening: checkTimeSlot(rawUser?.thursday, "Evening"),
      lateNight: checkTimeSlot(rawUser?.thursday, "Late Night"), // Added lateNight
    },
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
    { label: 'Gender Preference', value: rawUser.prefGender || 'No preference' },
    { label: 'Learning Style', value: LearningStyles[rawUser.prefLearningStyle] || 'not specified' },
    { label: 'More Than One Chavruta', value: formatField(rawUser.prefNumberOfMatches) },
    // Conditional learning skill based on country
    { 
      label: rawUser.country === 'Israel' ? 'Desired Learning Skill' : 'Learning Skill', 
      value: rawUser.country === 'Israel' 
        ? (SkillLevels[rawUser.desiredSkillLevel] || 'not specified')
        : (SkillLevels[rawUser.skillLevel] || 'not specified')
    },
    // Conditional English level based on country
    { 
      label: rawUser.country === 'Israel' ? 'English Level' : 'Desired English Level', 
      value: rawUser.country === 'Israel' 
        ? (EnglishLevels[rawUser.englishLevel] || 'not specified')
        : (EnglishLevels[rawUser.desiredEnglishLevel] || 'not specified')
    },
  ];

  const calculateAge = (birthYear: number | string): string => {
    if (!birthYear) return 'Not specified';
    const year = Number(birthYear);
    if (isNaN(year)) return 'Not specified';
    const currentYear = new Date().getFullYear();
    return String(currentYear - year);
  };

  const extraDetails: LabelValuePair[] = [
     { label: 'Gender', value: rawUser.gender || 'Not specified' },
     { label: 'Age', value: calculateAge(rawUser.age) },
        { label: 'Location', value: formatLocation() },
    { label: 'Jewish Affiliation', value: formatField(rawUser.jewishAndComAff) },
    { label: 'Profession', value: formatField(rawUser.profession) }
  ];

  const languages: LabelValuePair[] = [
    {
      label: "Other Languages",
      value: rawUser.otherLanguages || "Not specified"
    }
  ];

  const formatArrayResponse = (arr: any[] | null | undefined) => {
    if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
    return arr
      .filter(item => item && String(item).trim())
      .join('\n') || 'None provided';
  };

  const openQuestions: Question[] = [];

  if (rawUser.whoIntroduced) {
      openQuestions.push({
        id: 'whoIntroduced',
        question: 'Who Introduced You?',
        answer: rawUser.whoIntroduced
      });
    }
    console.log(openQuestions);

  if (rawUser.country === 'Israel') {
    // Questions for Israeli users
    if (rawUser.biographHeb) {
      openQuestions.push({
        id: 'biography',
        question: 'Tell us about yourself',
        answer: rawUser.biographHeb
      });
    }
    if (rawUser.whyJoinShalhevet) {
      openQuestions.push({
        id: 'whyJoin',
        question: 'Why did you join Shalhevet?',
        answer: rawUser.whyJoinShalhevet
      });
    }
    if (rawUser.personalTraits) {
      openQuestions.push({
        id: 'traits',
        question: 'Personal Traits',
        answer: rawUser.personalTraits
      });
    }
  } else {
    // Questions for non-Israeli users
    if (rawUser.personalBackground) {
      openQuestions.push({
        id: 'background',
        question: 'Tell us about yourself',
        answer: rawUser.personalBackground
      });
    }
    if (rawUser.experience) {
      openQuestions.push({
        id: 'experience',
        question: 'Experience',
        answer: rawUser.experience
      });
    }
    if (rawUser.additionalInfo) {
      openQuestions.push({
        id: 'additionalInfo',
        question: 'Additional Information',
        answer: rawUser.additionalInfo
      });
    }
    if (rawUser.hopesExpectations) {
      openQuestions.push({
        id: 'hopesExpectations',
        question: 'Hopes and Expectations',
        answer: Array.isArray(rawUser.hopesExpectations) 
          ? rawUser.hopesExpectations.join('\n')
          : rawUser.hopesExpectations
      });
    }
    if (rawUser.requestsFromPair) {
      openQuestions.push({
        id: 'requests',
        question: 'Requests',
        answer: rawUser.requestsFromPair
      });
    }
  }


  

  const formatTrackNames = async (trackIds: string[] = []): Promise<TrackInfo[]> => {
    if (!Array.isArray(trackIds) || trackIds.length === 0) return [];
    
    const tracks = Object.values(PreferredTracksInfo)
      .filter(track => track.id)
      .map(track => ({
        id: track.id,
        trackEn: track.trackEn
      }));

    return trackIds
      .map(id => tracks.find(track => track.id === id))
      .filter((track): track is TrackInfo => !!track);
  };

  // Get the track names from the prefTra field
  const trackNames = await formatTrackNames(Array.isArray(rawUser.prefTracks) ? rawUser.prefTracks : []);

  return {
    chavrutaPreference,
    extraDetails,
    learningTracks: trackNames,
    languages,
    learningTimes,
    openQuestions
  };
}

// Add this to formatters.ts
export async function reverseFormatUserData(formattedData: ChavrutaCardProps): Promise<Record<string, any>> {
  // Helper function to convert learning times back to array format
  const convertLearningTimes = (dayTimes: LearningTime): string[] => {
    const times: string[] = [];
    if (dayTimes.morning) times.push("Morning");
    if (dayTimes.noon) times.push("Noon"); // Changed from afternoon to noon
    if (dayTimes.evening) times.push("Evening");
    if (dayTimes.lateNight) times.push("Late Night"); // Added lateNight
    return times;
  };

  // Helper function to find value by label in array - with array safety check
  const findValueByLabel = (arr: LabelValuePair[], label: string): string | number => {
    if (!Array.isArray(arr)) {
      console.warn(`findValueByLabel: Expected array but received ${typeof arr} for label "${label}"`);
      return '';
    }
    const item = arr.find(item => item && item.label === label);
    return item?.value || '';
  };

  // Ensure formattedData properties are arrays before using them
  const chavrutaPreference = Array.isArray(formattedData.chavrutaPreference) ? formattedData.chavrutaPreference : [];
  const extraDetails = Array.isArray(formattedData.extraDetails) ? formattedData.extraDetails : [];
  const languages = Array.isArray(formattedData.languages) ? formattedData.languages : [];
  const openQuestions = Array.isArray(formattedData.openQuestions) ? formattedData.openQuestions : [];
  const learningTracks = Array.isArray(formattedData.learningTracks) ? formattedData.learningTracks : [];

  // Get all tracks to convert track names back to IDs
  const trackIds = learningTracks.map(track => track.id).filter(id => id);

  const rawData: Record<string, any> = {
    // Convert learning times back to arrays
    sunday: formattedData.learningTimes?.sunday ? convertLearningTimes(formattedData.learningTimes.sunday) : [],
    monday: formattedData.learningTimes?.monday ? convertLearningTimes(formattedData.learningTimes.monday) : [],
    tuesday: formattedData.learningTimes?.tuesday ? convertLearningTimes(formattedData.learningTimes.tuesday) : [],
    wednesday: formattedData.learningTimes?.wednesday ? convertLearningTimes(formattedData.learningTimes.wednesday) : [],
    thursday: formattedData.learningTimes?.thursday ? convertLearningTimes(formattedData.learningTimes.thursday) : [],

    // Convert chavruta preferences
    prefGender: findValueByLabel(chavrutaPreference, 'Gender Preference'),
    prefLearningStyle: findValueByLabel(chavrutaPreference, 'Learning Style'),
    prefNumberOfMatches: findValueByLabel(chavrutaPreference, 'More Than One Chavruta'),
    
    // Handle both learning skill and desired learning skill
    skillLevel: findValueByLabel(chavrutaPreference, 'Learning Skill'),
    desiredSkillLevel: findValueByLabel(chavrutaPreference, 'Desired Learning Skill'),

    // Handle both English level and desired English level
    englishLevel: findValueByLabel(chavrutaPreference, 'English Level'),
    desiredEnglishLevel: findValueByLabel(chavrutaPreference, 'Desired English Level'),

    // Convert extra details
    gender: findValueByLabel(extraDetails, 'Gender'),
    jewishAndComAff: findValueByLabel(extraDetails, 'Jewish Affiliation'),
    profession: findValueByLabel(extraDetails, 'Profession'),

    // Convert location - with safety checks
    city: (() => {
      const location = findValueByLabel(extraDetails, 'Location').toString();
      return location.split(',')[0]?.trim() || '';
    })(),
    country: (() => {
      const location = findValueByLabel(extraDetails, 'Location').toString();
      return location.split(',')[1]?.trim() || '';
    })(),

    // Convert languages
    otherLanguages: languages.map(lang => lang.value).filter(value => value),

    // Convert open questions - with safety checks
    personalBackground: openQuestions.find(q => q.question === 'Tell us about yourself')?.answer || '',
    biographHeb: openQuestions.find(q => q.question === 'Tell us about yourself')?.answer || '',
    whyJoinShalhevet: openQuestions.find(q => q.question === 'Why did you join Shalhevet?')?.answer || '',
    personalTraits: openQuestions.find(q => q.question === 'Personal Traits')?.answer || '',
    experience: openQuestions.find(q => q.question === 'Experience')?.answer || '',
    requestsFromPair: openQuestions.find(q => q.question === 'Requests')?.answer || '',
    whoIntroduced: openQuestions.find(q => q.question === 'Who Introduced You?')?.answer || '',
    hopesExpectations: (() => {
      const hopesAnswer = openQuestions.find(q => q.question === 'Hopes and Expectations')?.answer;
      return hopesAnswer ? hopesAnswer.split('\n').filter(line => line.trim()) : [];
    })(),
    additionalInfo: openQuestions.find(q => q.question === 'Additional Information')?.answer || '',

    // Convert learning tracks
    prefTracks: trackIds,
  };

  // Clean up the data by removing 'Not specified' and 'None provided' values
  Object.keys(rawData).forEach(key => {
    if (rawData[key] === 'Not specified' || rawData[key] === 'None provided' || rawData[key] === 'No preference') {
      rawData[key] = '';
    }
  });

  return rawData;
}

// Add to formatters.ts

// Helper function to initialize learning times for forms
export function initializeFormLearningTimes(user: Record<string, any>): LearningTimes {
  return {
    sunday: {
      morning: checkTimeSlot(user?.sunday, "Morning"),
      noon: checkTimeSlot(user?.sunday, "Noon"),
      evening: checkTimeSlot(user?.sunday, "Evening"),
      lateNight: checkTimeSlot(user?.sunday, "Late Night"),
    },
    monday: {
      morning: checkTimeSlot(user?.monday, "Morning"),
      noon: checkTimeSlot(user?.monday, "Noon"),
      evening: checkTimeSlot(user?.monday, "Evening"),
      lateNight: checkTimeSlot(user?.monday, "Late Night"),
    },
    tuesday: {
      morning: checkTimeSlot(user?.tuesday, "Morning"),
      noon: checkTimeSlot(user?.tuesday, "Noon"),
      evening: checkTimeSlot(user?.tuesday, "Evening"),
      lateNight: checkTimeSlot(user?.tuesday, "Late Night"),
    },
    wednesday: {
      morning: checkTimeSlot(user?.wednesday, "Morning"),
      noon: checkTimeSlot(user?.wednesday, "Noon"),
      evening: checkTimeSlot(user?.wednesday, "Evening"),
      lateNight: checkTimeSlot(user?.wednesday, "Late Night"),
    },
    thursday: {
      morning: checkTimeSlot(user?.thursday, "Morning"),
      noon: checkTimeSlot(user?.thursday, "Noon"),
      evening: checkTimeSlot(user?.thursday, "Evening"),
      lateNight: checkTimeSlot(user?.thursday, "Late Night"),
    },
  };
}

// Helper function to convert learning times back to server format
export function convertLearningTimesToServerFormat(learningTimes: LearningTimes): Record<string, string[]> {
  const slotMap = {
    'morning': 'Morning',
    'noon': 'Noon',
    'evening': 'Evening',
    'lateNight': 'Late Night',
  };

  const result: Record<string, string[]> = {};
  
  Object.entries(learningTimes).forEach(([day, slots]) => {
    result[day] = Object.entries(slots)
      .filter(([_, isSelected]) => isSelected)
      .map(([slot]) => slotMap[slot as keyof typeof slotMap]);
  });

  return result;
}

// Helper function to ensure scalar values
const ensureScalar = (value: any): string => {
  if (Array.isArray(value)) {
    return value[0] !== undefined ? String(value[0]) : '';
  }
  // Fix: explicitly check for null/undefined instead of all falsy values
  return value !== null && value !== undefined ? String(value) : '';
};

// Helper function to convert numeric index to string value
const convertIndexToValue = (index: any, array: string[]): string => {
  const numIndex = parseInt(ensureScalar(index));
  // Fix: explicitly check for NaN instead of treating 0 as falsy
  if (isNaN(numIndex) || numIndex < 0 || numIndex >= array.length) {
    return '';
  }
  return array[numIndex];
};

// Updated helper function to initialize form data
export function initializeFormData(user: Record<string, any>) {
  // Determine if user is Israeli to get the correct fields
  const isIsraeli = user.country === 'Israel';
  
  return {
    // Keep the original user ID and other important fields
    _id: user._id,
    _createdDate: user._createdDate,
    _updatedDate: user._updatedDate,
    
    // Form fields
    fullName: ensureScalar(user.fullName),
    email: ensureScalar(user.email),
    phoneNumber: ensureScalar(user.phoneNumber),
    tel: ensureScalar(user.tel),
    gender: ensureScalar(user.gender),
    prefTracks: user.prefTracks || [], // Use only prefTracks
    prefNumberOfMatches: ensureScalar(user.prefNumberOfMatches),
    country: ensureScalar(user.country),
    city: ensureScalar(user.city),
    age: user.age,
    profession: ensureScalar(user.profession),
    jewishAndComAff: ensureScalar(user.jewishAndComAff),
    
    // Convert skill level based on Israeli vs non-Israeli
    skillLevel: isIsraeli 
      ? convertIndexToValue(user.desiredSkillLevel, SkillLevels)
      : convertIndexToValue(user.skillLevel, SkillLevels),
    // Convert English level based on Israeli vs non-Israeli  
    englishLevel: isIsraeli 
      ? convertIndexToValue(user.englishLevel, EnglishLevels)
      : convertIndexToValue(user.desiredEnglishLevel, EnglishLevels),
    // Convert learning style
    learningStyle: convertIndexToValue(user.prefLearningStyle, LearningStyles),
    prefGender: ensureScalar(user.prefGender),
    // Add other languages field
    otherLanguages: ensureScalar(user.otherLanguages),
    learningTimes: initializeFormLearningTimes(user),
    
    // Keep all other original fields that might be needed
    ...Object.keys(user).reduce((acc, key) => {
      // Only include fields not already handled above
      if (!['fullName', 'email', 'phoneNumber', 'tel', 'gender', 'prefTracks', 'prefNumberOfMatches', 
            'country', 'city', 'age', 'profession', 'jewishAndComAff', 'desiredSkillLevel', 'skillLevel',
            'englishLevel', 'desiredEnglishLevel', 'prefLearningStyle', 'prefGender', 'otherLanguages',
            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].includes(key)) {
        acc[key] = user[key];
      }
      return acc;
    }, {} as Record<string, any>),
  };
}

// Add this new function to formatters.ts
export function prepareDataForSaving(editedData: Record<string, any>): Record<string, any> {
  // Simple conversion: convert level strings back to indices and fix data types
  const dataToSave = { ...editedData };
  
  // Define the level arrays
  const SkillLevels = ["Beginner", "Moderate", "Advanced", "not specified"];
  const EnglishLevels = ["Doesn't have to be perfect. I know some Hebrew", "Conversational level", "Excellent (I don't know any Hebrew whatsoever)", "not specified"];
  const LearningStyles = ["Deep and Slow", "Progressed, flowing", "Text centered", "Philosophical, free talking, deriving from text into thought", "No significant or particular style"];
  
  // Convert skill level string to index if it exists
  if (dataToSave.skillLevel && typeof dataToSave.skillLevel === 'string') {
    const skillIndex = SkillLevels.indexOf(dataToSave.skillLevel);
    dataToSave.skillLevel = skillIndex !== -1 ? skillIndex : 0;
  }
  
  // Convert desired skill level string to index if it exists
  if (dataToSave.desiredSkillLevel && typeof dataToSave.desiredSkillLevel === 'string') {
    const desiredSkillIndex = SkillLevels.indexOf(dataToSave.desiredSkillLevel);
    dataToSave.desiredSkillLevel = desiredSkillIndex !== -1 ? desiredSkillIndex : 0;
  }
  
  // Convert English level string to index if it exists
  if (dataToSave.englishLevel && typeof dataToSave.englishLevel === 'string') {
    const englishIndex = EnglishLevels.indexOf(dataToSave.englishLevel);
    dataToSave.englishLevel = englishIndex !== -1 ? englishIndex : 0;
  }
  
  // Convert desired English level string to index if it exists
  if (dataToSave.desiredEnglishLevel && typeof dataToSave.desiredEnglishLevel === 'string') {
    const desiredEnglishIndex = EnglishLevels.indexOf(dataToSave.desiredEnglishLevel);
    dataToSave.desiredEnglishLevel = desiredEnglishIndex !== -1 ? desiredEnglishIndex : 0;
  }
  
  // Convert learning style string to index and save as prefLearningStyle
  if (dataToSave.learningStyle && typeof dataToSave.learningStyle === 'string') {
    const learningStyleIndex = LearningStyles.indexOf(dataToSave.learningStyle);
    dataToSave.prefLearningStyle = learningStyleIndex !== -1 ? learningStyleIndex : 0;
    // Remove the original learningStyle field since we're saving it as prefLearningStyle
    delete dataToSave.learningStyle;
  }
  
  // Convert gender string to array if it's a string
  if (dataToSave.gender && typeof dataToSave.gender === 'string') {
    dataToSave.gender = [dataToSave.gender];
  }
  
  // Convert prefGender string to array if it's a string
  if (dataToSave.prefGender && typeof dataToSave.prefGender === 'string') {
    dataToSave.prefGender = [dataToSave.prefGender];
  }
  
  // Convert prefNumberOfMatches to number if it's a string
  if (dataToSave.prefNumberOfMatches && typeof dataToSave.prefNumberOfMatches === 'string') {
    const numMatches = parseInt(dataToSave.prefNumberOfMatches);
    dataToSave.prefNumberOfMatches = !isNaN(numMatches) ? numMatches : 1;
  } else if (dataToSave.prefNumberOfMatches && typeof dataToSave.prefNumberOfMatches !== 'number') {
    // Handle any other non-number types by converting to number or defaulting to 1
    const numMatches = Number(dataToSave.prefNumberOfMatches);
    dataToSave.prefNumberOfMatches = !isNaN(numMatches) ? numMatches : 1;
  }

  // Handle prefTracks (ensure track IDs are strings)
  if (dataToSave.prefTracks && Array.isArray(dataToSave.prefTracks)) {
    dataToSave.prefTracks = dataToSave.prefTracks.map(track => {
      // If track is an object with id property, extract the id and convert to string
      if (typeof track === 'object' && track.id !== undefined) {
        return String(track.id);
      }
      // If track is already a string, use it directly
      if (typeof track === 'string') {
        return track;
      }
      // For any other type, try to convert to string
      return String(track);
    }).filter(id => id && id !== 'null' && id !== 'undefined'); // Remove empty/invalid values
  }
  
  return dataToSave;
}

