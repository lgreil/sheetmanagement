<template>
  <div class="drive-folder">
    <UModal v-model="isOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ folderData?.metadata?.name || 'Google Drive Folder' }}
            </h3>
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              :loading="isLoading"
              @click="refreshFolder"
            />
          </div>
        </template>

        <div v-if="isLoading" class="flex justify-center py-4">
          <USpinner />
        </div>
        <div v-else-if="error" class="text-red-500 py-4">
          {{ error }}
        </div>
        <div v-else-if="folderData" class="min-h-[200px] max-h-[60vh] overflow-y-auto">
          <UTable
            :rows="folderData.contents"
            :columns="columns"
          >
            <template #name-data="{ row }">
              <div class="flex items-center gap-2">
                <span v-if="row.mimeType.includes('folder')" class="i-lucide-folder text-amber-500" />
                <span v-else class="i-lucide-file text-blue-500" />
                {{ row.name }}
              </div>
            </template>
            <template #modifiedTime-data="{ row }">
              {{ formatDate(row.modifiedTime) }}
            </template>
          </UTable>
        </div>
        <div v-else class="py-8 text-center text-gray-500">
          No files found in this folder
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="solid"
              @click="isOpen = false"
            >
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { format } from 'date-fns';
import { useDriveFolder, type DriveFile } from '~/composables/useDriveFolder';
import type { TableColumn } from '@nuxt/ui/dist/runtime/types';

const props = defineProps<{
  folderId: string;
}>();

const isOpen = ref(false);
const { isLoading, error, folderData, fetchFolderData } = useDriveFolder();

const columns: TableColumn<DriveFile>[] = [
  {
    key: 'name',
    label: 'Name',
  },
  {
    key: 'modifiedTime',
    label: 'Last Modified',
  },
];

function formatDate(date: string) {
  return format(new Date(date), 'PPp');
}

async function refreshFolder() {
  await fetchFolderData(props.folderId);
}

watch(() => isOpen.value, async (newValue) => {
  if (newValue && props.folderId) {
    await fetchFolderData(props.folderId);
  }
});

defineExpose({
  open: () => {
    isOpen.value = true;
  }
});
</script>

<style scoped>
.drive-folder {
  /* Add any custom styles here */
}
</style>
