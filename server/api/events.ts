import { readFileSync, writeFileSync } from 'fs';
import { defineEventHandler, readBody } from 'h3';
import { join } from 'path';

const eventsFile = join(process.cwd(), 'server/data/events.json');

// Helper to read events
const readEvents = () => {
    try {
        const data = readFileSync(eventsFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Helper to write events
const writeEvents = (events: any[]) => {
    writeFileSync(eventsFile, JSON.stringify(events, null, 2));
};

export default defineEventHandler(async (event) => {
    const method = event.method;

    // GET - Retrieve all events
    if (method === 'GET') {
        return readEvents();
    }

    // POST - Create new event
    if (method === 'POST') {
        const body = await readBody(event);
        const events = readEvents();
        const newEvent = {
            ...body,
            id: Date.now() // Simple way to generate unique IDs
        };
        events.push(newEvent);
        writeEvents(events);
        return newEvent;
    }

    // PUT - Update event
    if (method === 'PUT') {
        const body = await readBody(event);
        const events = readEvents();
        const index = events.findIndex((e: any) => e.id === body.id);
        if (index !== -1) {
            events[index] = body;
            writeEvents(events);
            return body;
        }
        throw new Error('Event not found');
    }

    // DELETE - Delete event
    if (method === 'DELETE') {
        const body = await readBody(event);
        const events = readEvents().filter((e: any) => e.id !== body.id);
        writeEvents(events);
        return { success: true };
    }
});
