import { GoogleDriveService } from '~/server/services/googleDrive';
import { CacheService } from '~/server/services/cache';

export default defineEventHandler(async (event) => {
  const folderId = event.context.params?.folderId;
  if (!folderId) {
    throw createError({
      statusCode: 400,
      message: 'Folder ID is required',
    });
  }

  const cacheService = CacheService.getInstance();
  const driveService = GoogleDriveService.getInstance();

  try {
    // Try to get folder metadata from cache
    const cachedMetadata = await cacheService.get(
      cacheService.generateDriveKey('folder', folderId)
    );
    if (cachedMetadata) {
      return {
        metadata: cachedMetadata,
        contents: await cacheService.get(
          cacheService.generateDriveKey('contents', folderId)
        ),
        fromCache: true,
      };
    }

    // If not in cache, fetch from Google Drive
    const [metadata, contents] = await Promise.all([
      driveService.getFolderMetadata(folderId),
      driveService.listFolderContents(folderId),
    ]);

    // Cache the results
    await Promise.all([
      cacheService.set(
        cacheService.generateDriveKey('folder', folderId),
        metadata
      ),
      cacheService.set(
        cacheService.generateDriveKey('contents', folderId),
        contents
      ),
    ]);

    return {
      metadata,
      contents,
      fromCache: false,
    };
  } catch (error) {
    console.error('Error fetching drive folder:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch folder contents',
    });
  }
});
