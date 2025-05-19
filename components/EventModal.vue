<template>
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium">
                        {{ event ? 'Edit Event' : 'New Event' }}
                    </h3>
                    <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-x-mark"
                        @click="close"
                    />
                </div>
            </template>

            <form @submit.prevent="save">
                <div class="space-y-4">
                    <UFormGroup label="Event Name" required>
                        <UInput v-model="form.name" />
                    </UFormGroup>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormGroup label="Date" required>
                            <UInput
                                v-model="dateString"
                                type="date"
                                :min="new Date().toISOString().split('T')[0]"
                            />
                        </UFormGroup>

                        <UFormGroup label="Time" required>
                            <UInput v-model="form.time" type="time" />
                        </UFormGroup>
                    </div>

                    <UFormGroup label="Type" required>
                        <USelect
                            v-model="form.type"
                            :options="Object.keys(eventTypes)"
                            option-attribute="value"
                        />
                    </UFormGroup>

                    <UFormGroup label="Location" required>
                        <UInput v-model="form.location" />
                    </UFormGroup>

                    <UFormGroup label="Address">
                        <UTextarea v-model="form.address" />
                    </UFormGroup>

                    <UFormGroup label="Description" required>
                        <UTextarea v-model="form.description" />
                    </UFormGroup>

                    <UFormGroup label="Program">
                        <UTextarea v-model="form.program" />
                    </UFormGroup>

                    <UFormGroup label="Participants">
                        <UTextarea
                            v-model="participantsText"
                            placeholder="Enter participants (one per line)"
                        />
                    </UFormGroup>

                    <UFormGroup label="Notes">
                        <UTextarea v-model="form.notes" />
                    </UFormGroup>

                    <UFormGroup label="Duration">
                        <UInput v-model="form.duration" placeholder="e.g. 2 hours" />
                    </UFormGroup>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton
                            color="gray"
                            variant="soft"
                            @click="close"
                        >
                            Cancel
                        </UButton>
                        <UButton
                            type="submit"
                            color="primary"
                            :loading="saving"
                        >
                            {{ event ? 'Update' : 'Create' }}
                        </UButton>
                    </div>
                </template>
            </form>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import type { Event, SerializableDate } from '~/types/events';
import { useEventTypes } from '~/composables/useEventTypes';

const props = defineProps<{
    modelValue: boolean;
    event?: Event;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'save', event: Omit<Event, 'id'>): void;
}>();

const { eventTypes } = useEventTypes();
const saving = ref(false);
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// Form state
const form = ref<Partial<Event>>({
    name: '',
    time: '',
    location: '',
    description: '',
    type: 'MISC',
    color: '',
    address: '',
    program: '',
    notes: '',
    duration: '',
});

// Handle date input
const dateString = computed({
    get: () => {
        if (!form.value.date) return '';
        const { year, month, day } = form.value.date;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    },
    set: (value: string) => {
        if (!value) return;
        const [year, month, day] = value.split('-').map(Number);
        form.value.date = { year, month, day };
    }
});

// Handle participants as text
const participantsText = computed({
    get: () => form.value.participants?.join('\n') || '',
    set: (value: string) => {
        form.value.participants = value
            .split('\n')
            .map(p => p.trim())
            .filter(Boolean);
    }
});

// Initialize form when editing an event
watch(() => props.event, (newEvent) => {
    if (newEvent) {
        form.value = { ...newEvent };
    } else {
        form.value = {
            name: '',
            time: '',
            location: '',
            description: '',
            type: 'MISC',
            color: eventTypes.MISC.color,
            date: {
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                day: new Date().getDate()
            }
        };
    }
}, { immediate: true });

// Save the event
const save = async () => {
    saving.value = true;
    try {
        // Set the color based on the event type
        form.value.color = eventTypes[form.value.type as keyof typeof eventTypes].color;
        
        emit('save', form.value as Omit<Event, 'id'>);
        close();
    } catch (error) {
        console.error('Failed to save event:', error);
    } finally {
        saving.value = false;
    }
};

// Close the modal
const close = () => {
    isOpen.value = false;
    if (!props.event) {
        form.value = {
            name: '',
            time: '',
            location: '',
            description: '',
            type: 'MISC',
            color: eventTypes.MISC.color
        };
    }
};
</script>
