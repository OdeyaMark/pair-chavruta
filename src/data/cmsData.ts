import consola from 'consola';
import { items } from '@wix/data';






export async function fetchCMSData() {
  try {
  consola.info('Fetching CMS data...');
  const results = await items.query('regFormEn').fields("fullName", "country", "havrutaFound", "_createdDate", "_id").limit(1000).find();
  return results.items;
  } catch (error) {
  consola.error('Error fetching CMS data:', error);
  }
}
  
export async function saveUserChanges(userData: User, user_id: string) {
  try {
    consola.info('Saving user changes...', userData);
    if (!user_id) {
      throw new Error('User ID is required');
    }
    userData._id = user_id;
    const results = await items.update("regFormEn", userData);
    return results;
  } catch (error) {
    consola.error('Error saving user changes:', error);
    throw error; // Rethrow to handle in UI
  }
}


export async function fetchUserById(userId: string) {
  try {
    consola.info(`Fetching user data for ID: ${userId}`);
    const result = await items.query('regFormEn')
      .eq('_id', userId)
      .find();
    const user = result.items[0] || null;
    consola.success('Fetched user:', user);
    return user;
  } catch (error) {
    consola.error('Error fetching user by ID:', error);
    return null;
  }
}

interface Track {
  id: string;
  trackEn: string;
}

// Function to fetch tracks and log them - run this during development to get the data
export async function fetchTracks() {
  try {
    consola.info('Fetching tracks data...');
    const results = await items.query('tracks')
      .fields("_id", "trackEn")
      .find();
    
    const tracks: Track[] = results.items.map(item => ({
      id: item._id,
      trackEn: item.trackEn
    }));

    // Log the tracks data to copy into the static file
    consola.success('Tracks data:', JSON.stringify({ tracks }, null, 2));
    return tracks;
  } catch (error) {
    consola.error('Error fetching tracks:', error);
    return [];
  }
}

// Import the static tracks data
import tracksData from './tracks.json';

// Function to get tracks, fetching from CMS if static data is empty
export async function getTracks(): Promise<Track[]> {
  // Check if we have data in the static file
  if (!tracksData.tracks || tracksData.tracks.length === 0) {
    consola.info('No tracks found in static file, fetching from CMS...');
    return await fetchTracks();
  }

  consola.info('Using tracks from static file');
  return tracksData.tracks;
}

export const fetchUserContact = async (userId: string): Promise<{ email: string; tel: string }> => {
  try {
    const response = await items.query('regFormEn')
      .eq('_id', userId).fields('email', 'tel')
      .find();
    
    const user = response.items[0];
    return {
      email: user?.email || '',
      tel: user?.tel || ''
    };
  } catch (error) {
    console.error('Error fetching user contact:', error);
    return { email: '', tel: '' };
  }
};


