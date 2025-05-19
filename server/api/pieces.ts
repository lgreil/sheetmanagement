import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { Piece } from '~/types/pieces';

const PIECES_FILE = resolve('./server/data/pieces.json');

function readPieces(): { pieces: Piece[] } {
    try {
        const data = readFileSync(PIECES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading pieces:', error);
        return { pieces: [] };
    }
}

function writePieces(pieces: { pieces: Piece[] }): void {
    try {
        writeFileSync(PIECES_FILE, JSON.stringify(pieces, null, 2));
    } catch (error) {
        console.error('Error writing pieces:', error);
    }
}

export default defineEventHandler(async (event) => {
    const method = event.method;
    const pieces = readPieces();

    // GET /api/pieces
    if (method === 'GET') {
        return pieces.pieces;
    }

    // POST /api/pieces
    if (method === 'POST') {
        const body = await readBody(event);
        const newPiece: Piece = {
            id: Math.max(0, ...pieces.pieces.map(p => p.id)) + 1,
            ...body
        };
        pieces.pieces.push(newPiece);
        writePieces(pieces);
        return newPiece;
    }

    // PUT /api/pieces/:id
    if (method === 'PUT') {
        const id = parseInt(event.context.params?.id as string);
        const body = await readBody(event);
        const index = pieces.pieces.findIndex(p => p.id === id);
        if (index === -1) {
            throw createError({
                statusCode: 404,
                message: 'Piece not found'
            });
        }
        pieces.pieces[index] = { ...pieces.pieces[index], ...body };
        writePieces(pieces);
        return pieces.pieces[index];
    }

    // DELETE /api/pieces/:id
    if (method === 'DELETE') {
        const id = parseInt(event.context.params?.id as string);
        const index = pieces.pieces.findIndex(p => p.id === id);
        if (index === -1) {
            throw createError({
                statusCode: 404,
                message: 'Piece not found'
            });
        }
        pieces.pieces.splice(index, 1);
        writePieces(pieces);
        return { success: true };
    }
});
