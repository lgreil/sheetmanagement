import type { Event } from '~/types/events';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { ref } from 'vue';
import { useErrorHandler } from '~/composables/useErrorHandler';

export const useEvents = () => {
    const events = ref<Event[]>([]);
    const { loading: isLoading, error: errorMsg, handleApiCall, handleFileOperation } = useErrorHandler();

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
        return handleFileOperation(
            async () => {
                const data = await readEventsFile();
                events.value = data.events;
                return data.events;
            },
            'Failed to fetch events'
        );
    };

    // Create new event
    const createEvent = async (event: Omit<Event, 'id'>) => {
        return handleFileOperation(
            async () => {
                const data = await readEventsFile();
                const newEvent: Event = {
                    ...event,
                    id: `${Date.now()}`
                };
                data.events.push(newEvent);
                await writeEventsFile(data);
                events.value = data.events;
                return newEvent;
            },
            'Failed to create event'
        );
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

    // Update existing event
    const updateEvent = async (event: Event) => {
        return handleApiCall(
            async () => {
                const updatedEvent = await $fetch('/api/events', {
                    method: 'PUT',
                    body: event
                });
                const index = events.value.findIndex(e => e.id === event.id);
                if (index !== -1) {
                    events.value[index] = updatedEvent;
                }
                return updatedEvent;
            },
            'Failed to update event'
        );
    };

    // Delete event
    const deleteEvent = async (eventId: string) => {
        return handleApiCall(
            async () => {
                await $fetch('/api/events', {
                    method: 'DELETE',
                    body: { id: eventId }
                });
                events.value = events.value.filter(e => e.id !== eventId);
            },
            'Failed to delete event'
        );
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
        return handleFileOperation(
            async () => {
                const text = await file.text();
                const importedEvents = JSON.parse(text);
                
                if (!Array.isArray(importedEvents)) {
                    throw new Error('Invalid file format');
                }

                for (const event of importedEvents) {
                    await createEvent(event);
                }

                await fetchEvents();
            },
            'Failed to import events'
        );
    };

    // Initialize events
    fetchEvents();

    return {
        events,
        isLoading,
        error: errorMsg,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        getEventsForPiece,
        exportEvents,
        importEvents
    };
};