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

  const calculateAge = (birthYear: number | string): string => {
    if (!birthYear) return 'Not specified';
    const year = Number(birthYear);
    if (isNaN(year)) return 'Not specified';
    const currentYear = new Date().getFullYear();
    return String(currentYear - year);
  };

  const extraDetails: LabelValuePair[] = [
     { label: 'Gender', value: rawUser.gender?.trim() || 'Not specified' },
     { label: 'Age', value: calculateAge(rawUser.age) },
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

  const openQuestions: Question[] = [];

  if (rawUser.whoIntroduced) {
      openQuestions.push({
        id: 'whoIntroduced',
        question: 'Who Introduced You?',
        answer: rawUser.whoIntroduced
      });
    }
  
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
    if (rawUser.background) {
      openQuestions.push({
        id: 'background',
        question: 'Tell us about yourself',
        answer: rawUser.background
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
    if (rawUser.requests) {
      openQuestions.push({
        id: 'requests',
        question: 'Requests',
        answer: rawUser.requests
      });
    }
  }
  console.log("requests", rawUser.requests);

  

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

