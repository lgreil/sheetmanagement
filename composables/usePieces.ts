import type { Piece, NewPiece } from '~/types/pieces';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { ref } from 'vue';
import { useNuxtApp } from '#app';

export const usePieces = () => {
    const { $state } = useNuxtApp();
    const pieces = ref<Piece[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const getPiecesFilePath = () => resolve(process.cwd(), 'server/data/pieces.json');

    // Read the pieces file
    const readPiecesFile = async () => {
        const fileContent = await readFile(getPiecesFilePath(), 'utf-8');
        return JSON.parse(fileContent);
    };

    // Write to the pieces file
    const writePiecesFile = async (data: { pieces: Piece[] }) => {
        await writeFile(getPiecesFilePath(), JSON.stringify(data, null, 4), 'utf-8');
    };

    // Fetch all pieces from local JSON file
    const fetchPieces = async () => {
        isLoading.value = true;
        try {
            const data = await readPiecesFile();
            pieces.value = data.pieces;
        } catch (err) {
            error.value = 'Failed to fetch pieces';
            console.error('Error fetching pieces:', err);
        } finally {
            isLoading.value = false;
        }
    };

    // Create a new piece
    const createPiece = async (piece: NewPiece) => {
        isLoading.value = true;
        try {
            const data = await readPiecesFile();
            
            // Generate new stid
            const newStid = Math.max(...data.pieces.map((p: Piece) => p.stid), 0) + 1;
            const newPiece: Piece = { ...piece, stid: newStid };

            // Add the new piece to data and save
            data.pieces.push(newPiece);
            await writePiecesFile(data);
            
            // Update local state
            pieces.value = data.pieces;
            return newPiece;
        } catch (err) {
            error.value = 'Failed to create piece';
            console.error('Error creating piece:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // Update a piece
    const updatePiece = async (stid: number, updates: Partial<Omit<Piece, 'stid'>>) => {
        isLoading.value = true;
        try {
            const data = await readPiecesFile();
            const index = data.pieces.findIndex((p: Piece) => p.stid === stid);
            
            if (index === -1) {
                throw new Error('Piece not found');
            }

            // Update the piece
            data.pieces[index] = { ...data.pieces[index], ...updates };
            await writePiecesFile(data);

            // Update local state
            pieces.value = data.pieces;
            return data.pieces[index];
        } catch (err) {
            error.value = 'Failed to update piece';
            console.error('Error updating piece:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // Delete a piece
    const deletePiece = async (stid: number) => {
        isLoading.value = true;
        try {
            const data = await readPiecesFile();
            data.pieces = data.pieces.filter((p: Piece) => p.stid !== stid);
            await writePiecesFile(data);

            // Update local state
            pieces.value = data.pieces;
        } catch (err) {
            error.value = 'Failed to delete piece';
            console.error('Error deleting piece:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // Get a piece by ID
    const getPieceById = (stid: number) => {
        return pieces.value.find((p: Piece) => p.stid === stid);
        } catch (err) {
            error.value = 'Failed to add part with PDF';
            console.error('Error adding part with PDF:', err);
        }
    };

    // Add an attachment to a piece
    const addAttachment = async (pieceId: number, file: File) => {
        try {
            const uploadResponse = await uploadFile(file);
            const newAttachment: Attachment = {
                id: Date.now(),
                name: uploadResponse.name,
                type: uploadResponse.type,
                url: uploadResponse.url,
                size: uploadResponse.size,
                uploadDate: new Date().toISOString()
            };

            const piece = pieces.value.find(p => p.id === pieceId);
            if (piece) {
                const updatedPiece = {
                    ...piece,
                    attachments: [...(piece.attachments || []), newAttachment]
                };
                await updatePiece(updatedPiece);
            }
        } catch (err) {
            error.value = 'Failed to add attachment';
            console.error('Error adding attachment:', err);
        }
    };

    return {
        pieces,
        isLoading,
        error,
        fetchPieces,
        createPiece,
        updatePiece,
        deletePiece,
        exportPieces,
        importPieces,
        uploadFile,
        addPartWithPdf,
        addAttachment,
    };
};
