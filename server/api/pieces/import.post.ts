import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { Piece } from '~/types/pieces';

const getPiecesFilePath = () => resolve(process.cwd(), 'server/data/pieces.json');

export default defineEventHandler(async (event) => {
    try {
        const formData = await readMultipartFormData(event);
        if (!formData) {
            throw createError({
                statusCode: 400,
                message: 'No file uploaded'
            });
        }

        const file = formData.find(item => item.name === 'file');
        if (!file) {
            throw createError({
                statusCode: 400,
                message: 'No file found in form data'
            });
        }

        const content = new TextDecoder().decode(file.data);
        const data = JSON.parse(content);

        if (!data.pieces || !Array.isArray(data.pieces)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid file format'
            });
        }

        await writeFile(getPiecesFilePath(), JSON.stringify(data, null, 4), 'utf-8');
        return data;
    } catch (error) {
        console.error('Error importing pieces:', error);
        throw createError({
            statusCode: 500,
            message: 'Failed to import pieces'
        });
    }
}); 