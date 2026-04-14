import { supabase, IMAGES_BUCKET } from '../supabase/config';

/**
 * Uploads an image file to Supabase Storage bucket
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID (for organizing uploads)
 * @returns {Promise<{url: string, path: string}|null>} - Public URL and file path, or null on error
 */
export const uploadImageToSupabase = async (file, userId) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Create a unique file path: userId/timestamp-filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export const deleteImageFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image from Supabase:', error);
    return false;
  }
};
