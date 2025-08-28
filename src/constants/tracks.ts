// Enum for the track types
export enum PreferredTracks {
  Tanya = "Tanya",
  Talmud = "Talmud", 
  Parsha = "Parsha",
  Prayer = "Prayer", // Note: Fixed typo from "Payer" to "Prayer"
  PirkeiAvot = "PirkeiAvot",
  NoPreference = "NoPreference", // Note: Fixed typo from "NoPrefrence" to "NoPreference"
  IndependentLearning = "IndependentLearning"
}

// Mapping object with English descriptions and IDs
export const PreferredTracksInfo: Record<PreferredTracks, { trackEn: string; id?: string }> = {
  [PreferredTracks.Tanya]: {
    trackEn: "Chassidic Thought", 
    id: "df6ce1e8-1839-4749-bd4f-495295d75657"
  },
  [PreferredTracks.Talmud]: {
    trackEn: "Talmud",
    id: "e9a52d6e-5510-4259-a157-c661e9ff95e9"
  },
  [PreferredTracks.Parsha]: {
    trackEn: "Weekly Parsha",
    id: "3e55135c-846d-4f7e-a39c-c8512cc62714"
  },
  [PreferredTracks.Prayer]: {
    trackEn: "Prayer", 
    id: "c01b5f93-3797-473e-9eff-17bd7bddf736"
  },
  [PreferredTracks.PirkeiAvot]: {
    trackEn: "Pirkei Avot",
    id: "8fc9e767-d4bf-4093-ad17-bb366ca31adf"
  },
  [PreferredTracks.NoPreference]: {
    trackEn: "Don't Prefer"
  },
  [PreferredTracks.IndependentLearning]: {
    trackEn: "Independent",
    id: "788830c2-45f4-471d-aa0d-8c7412826562"
  }
};

// Helper functions for easy access
export const getTrackInfo = (track: PreferredTracks) => {
  return PreferredTracksInfo[track];
};

export const getTrackId = (track: PreferredTracks): string | undefined => {
  return PreferredTracksInfo[track].id;
};

export const getTracktrackEn = (track: PreferredTracks): string => {
  return PreferredTracksInfo[track].trackEn;
};

