import consola from 'consola';
import { items } from '@wix/data';
import { dashboard } from '@wix/dashboard';
import { PreferredTracksInfo } from '../constants/tracks';
import { sendWixEmail } from './sendEmails';
import tracksData from './tracks.json';
import {
  User,
  Chavruta,
  Track,
  UserContact,
  ContactDetails,
  UpdateFunction,
  UserUpdateRequest,
  ChavrutaStatus,
  COLLECTION_NAMES,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const QUERY_LIMIT = 1000;

// Track mapping for legacy migration (keep for reference but move to separate migration file if needed)
const LEGACY_TRACK_MAPPING: Record<number, string | null> = {
  0: "df6ce1e8-1839-4749-bd4f-495295d75657", // Tanya (Chassidic Thought)
  1: "e9a52d6e-5510-4259-a157-c661e9ff95e9", // Talmud
  2: "3e55135c-846d-4f7e-a39c-c8512cc62714", // Parsha (Weekly Parsha)
  3: "c01b5f93-3797-473e-9eff-17bd7bddf736", // Prayer
  4: "8fc9e767-d4bf-4093-ad17-bb366ca31adf", // PirkeiAvot
  5: null, // NoPreference
  6: "788830c2-45f4-471d-aa0d-8c7412826562"  // IndependentLearning
};

// ============================================================================
// User Operations
// ============================================================================

/**
 * Fetches all active (non-archived) users from CMS
 */
export async function fetchCMSData(): Promise<User[]> {
  try {
    consola.info('Fetching CMS data...');
    const results = await items
      .query(COLLECTION_NAMES.USERS)
      .fields("fullName", "country", "matchTo", "prefNumberOfMatches", "dateOfRegistered", "_id", "prefTracks")
      .ne('isInArchive', true)
      .descending('dateOfRegistered')
      .limit(QUERY_LIMIT)
      .find();
    
    return results.items as User[];
  } catch (error) {
    consola.error('Error fetching CMS data:', error);
    throw error;
  }
}

/**
 * Fetches archived users from CMS
 */
export async function fetchArchivedUsers(): Promise<User[]> {
  try {
    const result = await items
      .query(COLLECTION_NAMES.USERS)
      .fields("fullName", "country", "matchTo", "prefNumberOfMatches", "dateOfRegistered", "_id", "prefTracks")
      .eq('isInArchive', true)
      .find();
    
    return result.items as User[];
  } catch (error) {
    consola.error('Error fetching archived users:', error);
    throw error;
  }
}

/**
 * Fetches user data for matching algorithms
 */
export async function fetchMatchData(): Promise<User[]> {
  try {
    consola.info('Fetching match data...');
    const results = await items
      .query(COLLECTION_NAMES.USERS)
      .fields(
        "_id",
        "fullName", 
        "country", 
        "gender", 
        "prefGender",
        "skillLevel",
        "desiredSkillLevel", 
        "englishLevel",
        "desiredEnglishLevel",
        "prefLearningStyle",
        "prefTracks",
        "utcOffset",
        "sunday", "monday", "tuesday", "wednesday", "thursday",
        "matchTo", 
        "prefNumberOfMatches"
      )
      .ne('isInArchive', true)
      .descending('dateOfRegistered')
      .limit(QUERY_LIMIT)
      .find();
    
    consola.success(`Fetched ${results.items.length} users for matching`);
    return results.items as User[];
  } catch (error) {
    consola.error('Error fetching match data:', error);
    throw error;
  }
}

/**
 * Gets a user by ID from the database
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await items
      .query(COLLECTION_NAMES.USERS)
      .eq("_id", userId)
      .find();
    
    return result.items.length > 0 ? (result.items[0] as User) : null;
  } catch (error) {
    consola.error('Error fetching user by ID:', error);
    throw error;
  }
}

/**
 * @deprecated Use getUserById instead - this is kept for backward compatibility
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  try {
    consola.info(`Fetching user data for ID: ${userId}`);
    const user = await getUserById(userId);
    consola.success('Fetched user:', user);
    return user;
  } catch (error) {
    consola.error('Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Fetches minimal contact information for a user
 */
export async function fetchUserContact(userId: string): Promise<UserContact> {
  try {
    const response = await items
      .query(COLLECTION_NAMES.USERS)
      .eq('_id', userId)
      .fields('email', 'tel')
      .find();
    
    const user = response.items[0];
    return {
      email: user?.email || '',
      tel: user?.tel || ''
    };
  } catch (error) {
    consola.error('Error fetching user contact:', error);
    return { email: '', tel: '' };
  }
}

/**
 * Saves user changes to the database
 */
export async function saveUserChanges(userData: User, user_id: string): Promise<any> {
  try {
    consola.info('Saving user changes...', userData);
    if (!user_id) {
      throw new Error('User ID is required');
    }
    userData._id = user_id;
    const results = await items.update(COLLECTION_NAMES.USERS, userData);
    return results;
  } catch (error) {
    consola.error('Error saving user changes:', error);
    throw error;
  }
}

/**
 * Updates a user in the database with the provided update function
 */
export async function updateUserBase(userId: string, updateFn: UpdateFunction<User>): Promise<void> {
  try {
    consola.info('Updating user with ID:', userId);
    
    const userResult = await items
      .query(COLLECTION_NAMES.USERS)
      .eq("_id", userId)
      .find();
    
    if (userResult.items.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentUser = userResult.items[0] as User;
    const updatedUser = updateFn(currentUser);
    
    await items.update(COLLECTION_NAMES.USERS, updatedUser);
    consola.success('User updated successfully');
  } catch (error) {
    consola.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Updates multiple users in batch
 */
export async function updateMultipleUsers(updates: UserUpdateRequest[]): Promise<void> {
  try {
    consola.info('Updating multiple users:', updates.length);
    
    const updatePromises = updates.map(({ userId, updateFn }) => 
      updateUserBase(userId, updateFn)
    );
    
    await Promise.all(updatePromises);
    consola.success('All users updated successfully');
  } catch (error) {
    consola.error('Error updating multiple users:', error);
    throw error;
  }
}

/**
 * Archives a user by setting their isInArchive field to true
 */
export async function archiveUser(userId: string): Promise<void> {
  try {
    consola.info('Archiving user with ID:', userId);
    
    await updateUserBase(userId, (user) => ({
      ...user,
      isInArchive: true,
      dateOfArchive: new Date().toISOString(),
    }));
    
    consola.success('User archived successfully');
  } catch (error) {
    consola.error('Error archiving user:', error);
    throw error;
  }
}

/**
 * Unarchives a user by setting their isInArchive field to false
 */
export async function unarchiveUser(userId: string): Promise<void> {
  try {
    consola.info('Unarchiving user with ID:', userId);
    
    await updateUserBase(userId, (user) => ({
      ...user,
      isInArchive: false,
      dateOfUnarchive: new Date().toISOString(),
    }));
    
    consola.success('User unarchived successfully');
  } catch (error) {
    consola.error('Error unarchiving user:', error);
    throw error;
  }
}

/**
 * Permanently deletes a user from the database
 * WARNING: This action cannot be undone. Use with extreme caution.
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    consola.info('Permanently deleting user with ID:', userId);
    
    const user = await getUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Check if user has active chavrutas before deleting
    const userChavrutas = await items
      .query(COLLECTION_NAMES.CHAVRUTAS)
      .hasSome('newFromIsraelId', [userId])
      .or(items.query(COLLECTION_NAMES.CHAVRUTAS).hasSome('newFromWorldId', [userId]))
      .ne('isDeleted', true)
      .find();
    
    if (userChavrutas.items.length > 0) {
      consola.warn(`User ${userId} has ${userChavrutas.items.length} active chavrutas. Consider archiving instead.`);
    }
    
    await items.remove(COLLECTION_NAMES.USERS, userId);
    consola.success(`User ${user.fullName} (${userId}) permanently deleted from database`);
  } catch (error) {
    consola.error('Error deleting user:', error);
    throw error;
  }
}

// ============================================================================
// Chavruta Operations
// ============================================================================

/**
 * Fetches all active chavrutas from CMS
 */
export async function fetchChavrutasFromCMS(): Promise<Chavruta[]> {
  try {
    const results = await items
      .query(COLLECTION_NAMES.CHAVRUTAS)
      .descending('DateOfCreate')
      .ne('IsDeleted', true)
      .include('newFromIsraelId', 'newFromWorldId')
      .limit(QUERY_LIMIT)
      .find();
    
    consola.info("Fetched chavrutas", results);
    return results.items as Chavruta[];
  } catch (error) {
    consola.error('Error fetching chavrutas:', error);
    throw error;
  }
}

/**
 * Fetches pending chavrutas (status = Standby)
 */
export async function fetchPendingChavrutasFromCMS(): Promise<Chavruta[]> {
  try {
    const results = await items
      .query(COLLECTION_NAMES.CHAVRUTAS)
      .descending('DateOfCreate')
      .ne('IsDeleted', true)
      .eq('status', ChavrutaStatus.Standby)
      .include('newFromIsraelId', 'newFromWorldId')
      .limit(QUERY_LIMIT)
      .find();
    
    return results.items as Chavruta[];
  } catch (error) {
    consola.error('Error fetching pending chavrutas:', error);
    throw error;
  }
}

/**
 * Gets a chavruta by ID with populated user data
 */
export async function getChavrutaById(chavrutaId: string): Promise<Chavruta | null> {
  try {
    const result = await items
      .query(COLLECTION_NAMES.CHAVRUTAS)
      .eq("_id", chavrutaId)
      .include("newFromIsraelId", "newFromWorldId")
      .find();
    
    return result.items.length > 0 ? (result.items[0] as Chavruta) : null;
  } catch (error) {
    consola.error('Error fetching chavruta by ID:', error);
    throw error;
  }
}

/**
 * Base update function that fetches and updates a chavruta
 */
export async function updateChavrutaBase(
  chavrutaId: string, 
  updateFn: UpdateFunction<Chavruta>
): Promise<any> {
  try {
    const result = await items
      .query(COLLECTION_NAMES.CHAVRUTAS)
      .eq('_id', chavrutaId)
      .find();
    
    const chavruta = result.items[0];
    if (!chavruta) {
      throw new Error(`Chavruta with ID ${chavrutaId} not found`);
    }

    return await items.update(COLLECTION_NAMES.CHAVRUTAS, updateFn(chavruta as Chavruta));
  } catch (error) {
    consola.error('Error updating chavruta:', error);
    throw error;
  }
}

/**
 * Updates chavruta status
 */
export async function updateChavrutaStatus(chavrutaId: string, status: ChavrutaStatus): Promise<any> {
  return updateChavrutaBase(chavrutaId, (chavruta) => ({
    ...chavruta,
    status
  }));
}

/**
 * Updates chavruta track
 */
export async function updateChavrutaTrack(chavrutaId: string, track: string): Promise<any> {
  return updateChavrutaBase(chavrutaId, (chavruta) => ({
    ...chavruta,
    track
  }));
}

/**
 * Updates chavruta note
 */
export async function updateChavrutaNote(chavrutaId: string, note: string): Promise<any> {
  return updateChavrutaBase(chavrutaId, (chavruta) => ({
    ...chavruta,
    note
  }));
}

/**
 * Creates a new chavruta pair and updates user match counts
 */
export async function createNewPairInDatabase(
  israeliUserId: string, 
  worldUserId: string, 
  trackId: string
): Promise<any> {
  try {
    const israeliUser = await getUserById(israeliUserId);
    consola.info("Israeli user:", israeliUser);
    
    const newChavruta: Partial<Chavruta> = {
      newFromIsraelId: { _id: israeliUserId } as any,
      newFromWorldId: { _id: worldUserId } as any,
      track: trackId,
      status: ChavrutaStatus.Standby,
      dateOfCreate: new Date().toISOString(),
      isDeleted: false
    };
    
    const result = await items.insert(COLLECTION_NAMES.CHAVRUTAS, newChavruta);
    dashboard.showToast({ 
      message: `New pair created between ${israeliUser?.fullName || 'Israeli User'} and World user.`, 
      type: 'success' 
    });

    // Update matchTo count for both users
    try {
      const [israeliUserResult, worldUserResult] = await Promise.all([
        items.query(COLLECTION_NAMES.USERS).eq('_id', israeliUserId).find(),
        items.query(COLLECTION_NAMES.USERS).eq('_id', worldUserId).find()
      ]);

      const israeliUserData = israeliUserResult.items[0] as User;
      const worldUserData = worldUserResult.items[0] as User;

      if (!israeliUserData || !worldUserData) {
        throw new Error('One or both users not found when updating matchTo counts');
      }

      await Promise.all([
        items.update(COLLECTION_NAMES.USERS, {
          ...israeliUserData,
          matchTo: (israeliUserData.matchTo || 0) + 1
        }),
        items.update(COLLECTION_NAMES.USERS, {
          ...worldUserData,
          matchTo: (worldUserData.matchTo || 0) + 1
        })
      ]);

      consola.success(`Updated matchTo counts - Israeli: ${(israeliUserData.matchTo || 0) + 1}, World: ${(worldUserData.matchTo || 0) + 1}`);
    } catch (updateError) {
      consola.error('Error updating matchTo counts:', updateError);
    }

    return result;
  } catch (error) {
    consola.error('Error creating new pair:', error);
    throw error;
  }
}

/**
 * Activates a chavruta pair
 */
export async function activatePairInDatabase(chavrutaId: string, sendEmail: boolean): Promise<{ success: boolean; emailsSent: boolean }> {
  try {
    consola.info('Activating chavruta with ID:', chavrutaId, 'Send email:', sendEmail);
    
    await updateChavrutaBase(chavrutaId, (chavruta) => ({
      ...chavruta,
      status: ChavrutaStatus.Active,
      dateOfActivation: new Date().toISOString(),
      sendEmail: sendEmail,
    }));

    // TODO: Implement email sending when ready
    consola.success(`Chavruta ${chavrutaId} activated successfully`);
    return { success: true, emailsSent: sendEmail };
  } catch (error) {
    consola.error('Error activating pair:', error);
    throw error;
  }
}

/**
 * Soft deletes a chavruta (marks as deleted)
 */
export async function deletePairFromDatabase(pairId: string, reason: string): Promise<any> {
  consola.info(`Deleting pair ${pairId} for reason: ${reason}`);
  return updateChavrutaBase(pairId, (chavruta) => ({
    ...chavruta,
    isDeleted: true,
    deleteReason: reason,
    dateOfDelete: new Date().toISOString()
  }));
}

/**
 * Deletes a chavruta and decrements the matchTo field for both participants
 */
export async function deleteChavrutaAndUpdateUsers(chavrutaId: string): Promise<void> {
  try {
    consola.info('Starting chavruta deletion process for ID:', chavrutaId);
    
    const chavruta = await getChavrutaById(chavrutaId);
    if (!chavruta) {
      throw new Error('Chavruta not found');
    }

    const israeliUserId = (chavruta.newFromIsraelId as any)?._id;
    const diasporaUserId = (chavruta.newFromWorldId as any)?._id;

    consola.info('Found participant IDs:', { israeliUserId, diasporaUserId });

    // Update both users' matchTo field (decrement by 1)
    const userUpdates: UserUpdateRequest[] = [];

    if (israeliUserId) {
      userUpdates.push({
        userId: israeliUserId,
        updateFn: (user) => ({
          ...user,
          matchTo: Math.max(0, (user.matchTo || 1) - 1)
        })
      });
    }

    if (diasporaUserId) {
      userUpdates.push({
        userId: diasporaUserId,
        updateFn: (user) => ({
          ...user,
          matchTo: Math.max(0, (user.matchTo || 1) - 1)
        })
      });
    }

    if (userUpdates.length > 0) {
      await updateMultipleUsers(userUpdates);
      consola.success('User matchTo fields updated successfully');
    }

    // Soft delete the chavruta
    await updateChavrutaBase(chavrutaId, (chavruta) => ({
      ...chavruta,
      isDeleted: true,
      dateOfDelete: new Date().toISOString(),
      deleteReason: 'Deleted by admin'
    }));

    consola.success('Chavruta marked as deleted successfully');
  } catch (error) {
    consola.error('Error deleting chavruta and updating users:', error);
    throw error;
  }
}

// ============================================================================
// Track Operations
// ============================================================================

/**
 * Fetches tracks from CMS (for development/migration purposes)
 */
export async function fetchTracks(): Promise<Track[]> {
  try {
    consola.info('Fetching tracks data...');
    const results = await items
      .query(COLLECTION_NAMES.TRACKS)
      .fields("_id", "trackEn")
      .find();
    
    const tracks: Track[] = results.items.map(item => ({
      id: item._id,
      trackEn: item.trackEn
    }));

    consola.success('Tracks data:', JSON.stringify({ tracks }, null, 2));
    return tracks;
  } catch (error) {
    consola.error('Error fetching tracks:', error);
    return [];
  }
}

/**
 * Gets tracks, preferring static data over CMS fetch
 */
export async function getTracks(): Promise<Track[]> {
  if (!tracksData.tracks || tracksData.tracks.length === 0) {
    consola.info('No tracks found in static file, fetching from CMS...');
    return await fetchTracks();
  }

  consola.info('Using tracks from static file');
  return tracksData.tracks as Track[];
}

// ============================================================================
// Email Operations
// ============================================================================

/**
 * Sends pairing notification emails to both users
 */
export async function sendPairingEmail(
  sourceUserId: string, 
  targetUserId: string, 
  trackName: string
): Promise<void> {
  try {
    const [sourceUser, targetUser] = await Promise.all([
      getUserById(sourceUserId),
      getUserById(targetUserId)
    ]);

    if (!sourceUser || !targetUser) {
      throw new Error('Missing user data for email sending');
    }

    const getContactDetails = (user: User): ContactDetails => ({
      fName: user.fullName?.split(' ')[0] || '',
      lName: user.fullName?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phoneNumber || user.tel || ''
    });

    const getTrackIdFromName = (trackName: string): string | undefined => {
      const trackInfo = Object.values(PreferredTracksInfo)
        .find(track => track.trackEn === trackName);
      return trackInfo?.id;
    };

    const sourceUserContact = getContactDetails(sourceUser);
    const targetUserContact = getContactDetails(targetUser);
    const trackId = getTrackIdFromName(trackName);
    const link = `https://www.shalhevet.steinsaltzyeshiva.com/challenge-page/${trackId}`;

    const targetEmailVariables = {
      userName: targetUser.fullName,
      partnerName: sourceUser.fullName,
      partnerEmail: sourceUser.email,
      partnerPhone: sourceUser.phoneNumber || sourceUser.tel || '',
      link: link
    };

    const sourceEmailVariables = {
      userName: sourceUser.fullName,
      partnerName: targetUser.fullName,
      partnerEmail: targetUser.email,
      partnerPhone: targetUser.phoneNumber || targetUser.tel || '',
      link: link
    };

    const targetEmailId = targetUser.country?.toLowerCase() === 'israel' ? 'trackConfirmHe' : 'trackConfirmEn';
    const sourceEmailId = sourceUser.country?.toLowerCase() === 'israel' ? 'trackConfirmHe' : 'trackConfirmEn';

    await Promise.all([
      sendWixEmail(targetUserContact, targetEmailId, targetEmailVariables),
      sendWixEmail(sourceUserContact, sourceEmailId, sourceEmailVariables)
    ]);

    consola.success(`Pairing emails sent successfully to ${sourceUser.fullName} and ${targetUser.fullName}`);
  } catch (error) {
    consola.error('Error sending pairing email:', error);
    throw error;
  }
}