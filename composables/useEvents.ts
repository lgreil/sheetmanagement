import type { Event } from '~/types/events';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { ref } from 'vue';

export const useEvents = () => {
    const events = ref<Event[]>([]);
    const isLoading = ref(false);
    const errorMsg = ref<string | null>(null);

    const getEventsFilePath = () => resolve(process.cwd(), 'server/data/events.json');

    // Read events file
    const readEventsFile = async () => {
        const fileContent = await readFile(getEventsFilePath(), 'utf-8');
        return JSON.parse(fileContent) as { events: Event[] };
    };

    // Write to events file
    const writeEventsFile = async (data: { events: Event[] }) => {
        await writeFile(getEventsFilePath(), JSON.stringify(data, null, 4), 'utf-8');
    };

    // Load events
    const fetchEvents = async () => {
        isLoading.value = true;
        try {
            const data = await readEventsFile();
            events.value = data.events;
        } catch (err: unknown) {
            errorMsg.value = 'Failed to fetch events';
            console.error('Error fetching events:', err);
        } finally {
            isLoading.value = false;
        }
    };

    // Create new event
    const createEvent = async (event: Omit<Event, 'id'>) => {
        try {
            const data = await readEventsFile();
            const newEvent: Event = {
                ...event,
                id: `${Date.now()}`
            };
            data.events.push(newEvent);
            await writeEventsFile(data);
            events.value = data.events;
            return newEvent;
        } catch (err: unknown) {
            errorMsg.value = 'Failed to create event';
            console.error('Error creating event:', err);
            throw err;
        }
    };

    // Get events for a piece
    const getEventsForPiece = (pieceName: string) => {
        return events.value.filter(event => {
            const allPieces = [
                ...event.program,
                ...(event.additional_pieces || [])
            ];
            return allPieces.some(piece => 
                piece.title.toLowerCase() === pieceName.toLowerCase() ||
                piece.title.toLowerCase().includes(pieceName.toLowerCase()) ||
                (piece.title.toLowerCase().includes('bach') && pieceName.toLowerCase().includes('bach'))
            );
        });
    };

    // Initialize events
    fetchEvents();

    return {
        events,
        isLoading,
        error: errorMsg,
        fetchEvents,
        createEvent,
        getEventsForPiece
    };
};
            console.error('Failed to create event:', error);
            throw error;
        }
    };

    // Update existing event
    const updateEvent = async (event: Event) => {
        try {
            const updatedEvent = await $fetch('/api/events', {
                method: 'PUT',
                body: event
            });
            const index = events.value.findIndex(e => e.id === event.id);
            if (index !== -1) {
                events.value[index] = updatedEvent;
            }
            return updatedEvent;
        } catch (error) {
            console.error('Failed to update event:', error);
            throw error;
        }
    };

    // Delete event
    const deleteEvent = async (eventId: number) => {
        try {
            await $fetch('/api/events', {
                method: 'DELETE',
                body: { id: eventId }
            });
            events.value = events.value.filter(e => e.id !== eventId);
        } catch (error) {
            console.error('Failed to delete event:', error);
            throw error;
        }
    };

    // Export events to file
    const exportEvents = () => {
        const dataStr = JSON.stringify(events.value, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `calendar-events-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Import events from file
    const importEvents = async (file: File) => {
        try {
            const text = await file.text();
            const importedEvents = JSON.parse(text);
            
            // Validate imported data
            if (!Array.isArray(importedEvents)) {
                throw new Error('Invalid file format');
            }

            // Replace all events with imported ones
            for (const event of importedEvents) {
                await createEvent(event);
            }

            await fetchEvents(); // Refresh the events list
        } catch (error) {
            console.error('Failed to import events:', error);
            throw error;
        }
    };

    return {
        events,
        isLoading,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        exportEvents,
        importEvents
    };
};
