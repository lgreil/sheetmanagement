import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = resolve('./public/uploads');
const PIECES_DIR = join(UPLOAD_DIR, 'pieces');

// Ensure upload directories exist
async function ensureDirectories() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(PIECES_DIR)) {
        await mkdir(PIECES_DIR, { recursive: true });
    }
}

export async function saveFile(file: Buffer, originalName: string): Promise<string> {
    await ensureDirectories();
    
    // Generate unique filename
    const ext = originalName.split('.').pop() || '';
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = join(PIECES_DIR, fileName);
    
    // Save file
    await writeFile(filePath, file);
    
    // Return public URL
    return `/uploads/pieces/${fileName}`;
}

export function getPublicUrl(fileName: string): string {
    return `/uploads/pieces/${fileName}`;
}

// Initialize directories
ensureDirectories().catch(console.error);
