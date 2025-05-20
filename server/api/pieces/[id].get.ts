import { readFile } from 'fs/promises';
import { defineEventHandler, createError } from 'h3';
import { resolve } from 'path';
import type { Piece } from '~/types/pieces';

const PIECES_FILE = resolve(process.cwd(), 'server/data/pieces.json');

export default defineEventHandler(async (event) => {
    try {
        const id = Number(event.context.params?.id);
        if (isNaN(id)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid piece ID'
            });
        }

        const fileContent = await readFile(PIECES_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        const piece = data.pieces.find((p: Piece) => p.stid === id);

        if (!piece) {
            throw createError({
                statusCode: 404,
                message: 'Piece not found'
            });
        }

        return piece;
    } catch (error) {
        console.error('Error fetching piece:', error);
        throw createError({
            statusCode: 500,
            message: 'Internal server error'
        });
    }
}); 