import { ref } from 'vue';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  thumbnailLink?: string;
}

export interface DriveFolderData {
  metadata: {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
  };
  contents: DriveFile[];
  fromCache: boolean;
}

export function useDriveFolder() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const folderData = ref<DriveFolderData | null>(null);

  const fetchFolderData = async (folderId: string) => {
    if (!folderId) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`/api/drive/${folderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch folder data');
      }
      
      folderData.value = await response.json();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An error occurred';
      folderData.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    isLoading,
    error,
    folderData,
    fetchFolderData,
    clearError,
  };
}
