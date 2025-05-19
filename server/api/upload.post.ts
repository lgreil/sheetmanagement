import { saveFile } from '../utils/fileStorage';
import type { IncomingMessage } from 'http';
import formidable from 'formidable';
import { readFile } from 'fs/promises';

export default defineEventHandler(async (event) => {
    const form = formidable({});
    
    try {
        const [fields, files] = await form.parse(event.node.req as IncomingMessage);
        const file = files.file?.[0];
        
        if (!file) {
            throw createError({
                statusCode: 400,
                message: 'No file uploaded'
            });
        }

        // Read file content
        const content = await readFile(file.filepath);
        
        // Save file and get public URL
        const url = await saveFile(content, file.originalFilename || 'unnamed');
        
        return {
            url,
            name: file.originalFilename,
            size: file.size,
            type: file.mimetype
        };
    } catch (error) {
        console.error('File upload error:', error);
        throw createError({
            statusCode: 500,
            message: 'Failed to upload file'
        });
    }
});
