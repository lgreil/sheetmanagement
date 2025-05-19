<template>
  <div class="drive-folder-button">
    <UButton
      v-if="folderId"
      icon="i-lucide-folder"
      color="neutral"
      variant="ghost"
      size="sm"
      :loading="isLoading"
      @click="openDriveFolder"
    >
      View Files
    </UButton>
    <span v-else class="text-gray-400">No folder</span>

    <DriveFolder
      ref="driveFolderRef"
      :folder-id="folderId || ''"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  folderId?: string;
}>();

const isLoading = ref(false);
const driveFolderRef = ref<InstanceType<typeof DriveFolder> | null>(null);

const openDriveFolder = async () => {
  if (!props.folderId) return;
  driveFolderRef.value?.open();
};
</script>

<style scoped>
.drive-folder-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}
</style>
