import { readFile, writeFile } from 'fs/promises';
import { defineEventHandler, readBody, createError } from 'h3';
import { resolve } from 'path';
import type { Piece } from '~/types/pieces';

const PIECES_FILE = resolve(process.cwd(), 'server/data/pieces.json');

export default defineEventHandler(async (event) => {
    const method = event.method;

    try {
        // Read the current pieces file
        const fileContent = await readFile(PIECES_FILE, 'utf-8');
        const data = JSON.parse(fileContent);

        switch (method) {
            case 'GET':
                return data.pieces;

            case 'POST':
                const body = await readBody(event);
                // Generate new stid
                const newStid = Math.max(...data.pieces.map((p: Piece) => p.stid), 0) + 1;
                const newPiece = { ...body, stid: newStid };
                
                data.pieces.push(newPiece);
                await writeFile(PIECES_FILE, JSON.stringify(data, null, 4), 'utf-8');
                return newPiece;

            case 'PUT':
                const { stid, updates } = await readBody(event);
                const index = data.pieces.findIndex((p: Piece) => p.stid === stid);
                
                if (index === -1) {
                    throw createError({
                        statusCode: 404,
                        message: 'Piece not found'
                    });
                }

                data.pieces[index] = { ...data.pieces[index], ...updates };
                await writeFile(PIECES_FILE, JSON.stringify(data, null, 4), 'utf-8');
                return data.pieces[index];

            case 'DELETE':
                const { stid: deleteStid } = await readBody(event);
                data.pieces = data.pieces.filter((p: Piece) => p.stid !== deleteStid);
                await writeFile(PIECES_FILE, JSON.stringify(data, null, 4), 'utf-8');
                return { success: true };

            default:
                throw createError({
                    statusCode: 405,
                    message: 'Method not allowed'
                });
        }
    } catch (error) {
        console.error('Error handling pieces:', error);
        throw createError({
            statusCode: 500,
            message: 'Internal server error'
        });
    }
}); 