import { getTracks } from './cmsData';

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
  afternoon: boolean;
  evening: boolean;
}

export interface LearningTimes {
  sunday: LearningTime;
  monday: LearningTime;
  tuesday: LearningTime;
  wednesday: LearningTime;
  thursday: LearningTime;
}

export interface ChavrutaCardProps {
  chavrutaPreference: LabelValuePair[];
  extraDetails: LabelValuePair[];
  learningTracks: string[];
  languages: LabelValuePair[];
  learningTimes: LearningTimes;
  openQuestions: Question[];
}

// Helper functions
const checkTimeSlot = (dayValue: any, slot: string) => {
  if (!dayValue || !Array.isArray(dayValue)) {
    return false;
  }
  return dayValue.includes(slot) || false;
};

const formatName = (rawUser: Record<string, any>) => {
  if (rawUser.fullName?.trim()) return rawUser.fullName;
  const fName = rawUser.fName?.trim() || '';
  const lName = rawUser.lName?.trim() || '';
  return fName || lName ? `${fName} ${lName}`.trim() : 'Not specified';
};

const formatLocation = (rawUser: Record<string, any>) => {
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

const formatArrayResponse = (arr: any[] | null | undefined) => {
  if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
  return arr
    .filter(item => item && String(item).trim())
    .join('\n') || 'None provided';
};

// Main formatting function
export async function formatUserData(rawUser: Record<string, any>): ChavrutaCardProps {
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

// Add this to formatters.ts
export async function reverseFormatUserData(formattedData: ChavrutaCardProps): Promise<Record<string, any>> {
  // Helper function to convert learning times back to array format
  const convertLearningTimes = (dayTimes: LearningTime): string[] => {
    const times: string[] = [];
    if (dayTimes.morning) times.push("Morning");
    if (dayTimes.afternoon) times.push("Noon");
    if (dayTimes.evening) times.push("Evening");
    return times;
  };

  // Helper function to find value by label in array
  const findValueByLabel = (arr: LabelValuePair[], label: string): string | number => {
    const item = arr.find(item => item.label === label);
    return item?.value || '';
  };

  // Get all tracks to convert track names back to IDs
  const tracks = await getTracks();
  const trackIds = formattedData.learningTracks.map(trackName => 
    tracks.find(track => track.trackEn === trackName)?.id
  ).filter((id): id is string => !!id);
  console.log("tracks ids ", trackIds);

  const rawData: Record<string, any> = {
    // Convert learning times back to arrays
    sunday: convertLearningTimes(formattedData.learningTimes.sunday),
    monday: convertLearningTimes(formattedData.learningTimes.monday),
    tuesday: convertLearningTimes(formattedData.learningTimes.tuesday),
    wednesday: convertLearningTimes(formattedData.learningTimes.wednesday),
    thursday: convertLearningTimes(formattedData.learningTimes.thursday),

    // Convert chavruta preferences
    menOrWomen: findValueByLabel(formattedData.chavrutaPreference, 'Gender Preference'),
    learningStyle: findValueByLabel(formattedData.chavrutaPreference, 'Learning Style'),
    moreThanOneChavruta: findValueByLabel(formattedData.chavrutaPreference, 'More Than One Chavruta'),
    learningSkill: findValueByLabel(formattedData.chavrutaPreference, 'Learning Skill'),

    // Convert extra details
    gender: findValueByLabel(formattedData.extraDetails, 'Gender'),
    jewishAndComAff: findValueByLabel(formattedData.extraDetails, 'Jewish Affiliation'),
    profession: findValueByLabel(formattedData.extraDetails, 'Profession'),

    // Convert location
    city: findValueByLabel(formattedData.extraDetails, 'Location').toString().split(',')[0]?.trim(),
    country: findValueByLabel(formattedData.extraDetails, 'Location').toString().split(',')[1]?.trim(),

    // Convert languages
    otherLan: formattedData.languages.map(lang => lang.value),

    // Convert open questions
    background: formattedData.openQuestions.find(q => q.question === 'Background')?.answer,
    experience: formattedData.openQuestions.find(q => q.question === 'Experience')?.answer,
    requests: formattedData.openQuestions.find(q => q.question === 'Requests')?.answer,
    whoIntroduced: formattedData.openQuestions.find(q => q.question === 'Who Introduced You?')?.answer,
    hopesExpectations: formattedData.openQuestions
      .find(q => q.question === 'Hopes and Expectations')
      ?.answer.split('\n')
      .filter(line => line.trim()),
    additionalInfo: formattedData.openQuestions.find(q => q.question === 'Additional Information')?.answer,
    anythingElse: formattedData.openQuestions.find(q => q.question === 'Anything Else')?.answer,

    // Convert learning tracks
    prefTra: trackIds,
  };

  // Clean up the data by removing 'Not specified' and 'None provided' values
  Object.keys(rawData).forEach(key => {
    if (rawData[key] === 'Not specified' || rawData[key] === 'None provided') {
      rawData[key] = '';
    }
  });

  return rawData;
}

