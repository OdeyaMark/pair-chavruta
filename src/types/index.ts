/**
 * Central type definitions for the Pair Chavrutas application
 * These types are used across the codebase for type safety and consistency
 */

// ============================================================================
// Collection Names (Constants)
// ============================================================================

export const COLLECTION_NAMES = {
  USERS: 'Import3',
  CHAVRUTAS: 'Import5',
  TRACKS: 'tracks',
} as const;

// ============================================================================
// Time-related Types
// ============================================================================

export interface LearningTime {
  morning: boolean;
  noon: boolean;
  evening: boolean;
  lateNight: boolean;
}

export interface LearningTimes {
  sunday: LearningTime;
  monday: LearningTime;
  tuesday: LearningTime;
  wednesday: LearningTime;
  thursday: LearningTime;
}

export type DayOfWeek = keyof LearningTimes;
export type TimeSlot = keyof LearningTime;

// ============================================================================
// User Types
// ============================================================================

/**
 * Core user entity from the Import3 collection
 */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  tel?: string;
  phoneNumber?: string;
  country: string;
  gender: string;
  prefGender?: string;
  
  // Skill and language preferences
  skillLevel?: number;
  desiredSkillLevel?: number;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  prefLearningStyle?: number;
  
  // Learning preferences
  prefTracks?: string[] | number[]; // Can be track IDs or numeric references
  prefNumberOfMatches?: number;
  matchTo?: number; // Current number of matches
  
  // Timezone and availability
  utcOffset?: string | number;
  sunday?: LearningTime | string[];
  monday?: LearningTime | string[];
  tuesday?: LearningTime | string[];
  wednesday?: LearningTime | string[];
  thursday?: LearningTime | string[];
  
  // Open questions (Hebrew speakers)
  biographHeb?: string;
  whyJoinShalhevet?: string;
  personalTraits?: string;
  whatCanYouOffer?: string;
  whatDoYouExpect?: string;
  
  // Open questions (English speakers)
  biography?: string;
  whyJoinShalhevetGlobal?: string;
  characteristics?: string;
  whatCanYouShare?: string;
  whatExpect?: string;
  
  // Metadata
  whoIntroduced?: string;
  dateOfRegistered?: string;
  _createdDate?: string;
  isInArchive?: boolean;
  dateOfArchive?: string;
  dateOfUnarchive?: string;
}

/**
 * Minimal user data for contact purposes
 */
export interface UserContact {
  email: string;
  tel: string;
}

/**
 * User data formatted for matching algorithms
 */
export interface MatchUser {
  _id: string;
  fullName: string;
  country: string;
  gender: string;
  prefGender?: string;
  skillLevel?: number;
  desiredSkillLevel?: number;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  learningStyle?: number;
  prefTracks: number[];
  utcOffset: string | number;
  sunday?: LearningTime;
  monday?: LearningTime;
  tuesday?: LearningTime;
  wednesday?: LearningTime;
  thursday?: LearningTime;
  matchTo?: number;
  prefNumberOfMatches?: number;
}

// ============================================================================
// Chavruta (Pair) Types
// ============================================================================

/**
 * Core chavruta entity from the Import5 collection
 */
export interface Chavruta {
  _id: string;
  newFromIsraelId: { _id: string } | User;
  newFromWorldId: { _id: string } | User;
  track?: string; // Track ID
  status: number; // See ChavrutaStatus enum
  note?: string;
  
  // Dates
  dateOfCreate?: string;
  DateOfCreate?: string; // Inconsistent casing in DB
  dateOfActivation?: string;
  dateOfDelete?: string;
  
  // Deletion
  isDeleted?: boolean;
  IsDeleted?: boolean; // Inconsistent casing in DB
  deleteReason?: string;
  
  // Email
  sendEmail?: boolean;
}

/**
 * Chavruta with populated user data
 */
export interface ChavrutaWithUsers extends Chavruta {
  newFromIsraelId: User;
  newFromWorldId: User;
}

// ============================================================================
// Track Types
// ============================================================================

export interface Track {
  id: string;
  trackEn: string;
}

export interface TrackInfo {
  id: string;
  trackEn: string;
}

// ============================================================================
// UI/Display Types
// ============================================================================

export interface LabelValuePair {
  label: string;
  value: string | number;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
}

/**
 * Formatted user data for display in cards
 */
export interface ChavrutaCardProps {
  chavrutaPreference: LabelValuePair[];
  extraDetails: LabelValuePair[];
  learningTracks: TrackInfo[];
  languages: LabelValuePair[];
  learningTimes: LearningTimes;
  openQuestions: Question[];
}

/**
 * User row data for tables
 */
export interface UserRow {
  id: string;
  fullName: string;
  country: string;
  hasChavruta: string;
  details: string;
  contactDetails: string;
  edit: string;
  notes: string;
  archive: string;
  delete: string;
  registrationDate: string;
  registrationYear: string;
}

/**
 * Chavruta row data for tables
 */
export interface ChavrutaRow {
  id: string;
  israeliParticipant: string;
  diasporaParticipant: string;
  creationDate: string;
  track: string;
  status: string;
  matchDate: string;
  details: JSX.Element;
  mail: JSX.Element;
  delete: JSX.Element;
  participantData: {
    israeli: Record<string, any>;
    diaspora: Record<string, any>;
  };
  note?: string;
  deleteDate?: string;
  deleteReason?: string;
  notes?: JSX.Element;
}

// ============================================================================
// Function Parameter Types
// ============================================================================

/**
 * Update function type for base update operations
 */
export type UpdateFunction<T> = (current: T) => T;

/**
 * Batch user update request
 */
export interface UserUpdateRequest {
  userId: string;
  updateFn: UpdateFunction<User>;
}

/**
 * Contact details for email sending
 */
export interface ContactDetails {
  fName: string;
  lName: string;
  email: string;
  phone: string;
}

/**
 * Email variables for pairing notifications
 */
export interface PairingEmailVariables {
  userName: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
  link: string;
}

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Status values for chavrutas
 */
export enum ChavrutaStatus {
  Default = 0,
  Standby = 1,
  Active = 2,
  Learning = 3,
}

/**
 * English proficiency levels (indexed)
 */
export enum EnglishLevel {
  HasSomeHebrew = 0, // "Doesn't have to be perfect. I know some Hebrew"
  Conversational = 1,
  Excellent = 2, // "Excellent (I don't know any Hebrew whatsoever)"
  NotSpecified = 3,
}

/**
 * Learning skill levels (indexed)
 */
export enum SkillLevel {
  Beginner = 0,
  Moderate = 1,
  Advanced = 2,
  NotSpecified = 3,
}

/**
 * Learning style preferences (indexed)
 */
export enum LearningStyle {
  DeepAndSlow = 0,
  ProgressedFlowing = 1,
  TextCentered = 2,
  PhilosophicalFree = 3,
  NoSignificantStyle = 4,
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make specific properties required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Make specific properties optional
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Represents a database query result
 */
export interface QueryResult<T> {
  items: T[];
  totalCount?: number;
}

/**
 * Operation result with success status
 */
export interface OperationResult {
  success: boolean;
  error?: string;
  message?: string;
}