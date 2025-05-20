import type { Piece } from '~/types/pieces';
import { ref } from 'vue';

export const usePieces = () => {
    const pieces = ref<Piece[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchPieces = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await $fetch<Piece[]>('/api/pieces');
            pieces.value = response;
        } catch (e) {
            error.value = 'Failed to fetch pieces';
            console.error('Error fetching pieces:', e);
        } finally {
            loading.value = false;
        }
    };

    const fetchPieceById = async (stid: number) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await $fetch<Piece>(`/api/pieces/${stid}`);
            const index = pieces.value.findIndex(p => p.stid === stid);
            if (index !== -1) {
                pieces.value[index] = response;
            } else {
                pieces.value.push(response);
            }
            return response;
        } catch (e) {
            error.value = 'Failed to fetch piece';
            console.error('Error fetching piece:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const createPiece = async (piece: Omit<Piece, 'stid'>) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await $fetch<Piece>('/api/pieces', {
                method: 'POST',
                body: piece
            });
            pieces.value.push(response);
            return response;
        } catch (e) {
            error.value = 'Failed to create piece';
            console.error('Error creating piece:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const updatePiece = async (stid: number, updates: Partial<Piece>) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await $fetch<Piece>('/api/pieces', {
                method: 'PUT',
                body: { stid, updates }
            });
            const index = pieces.value.findIndex(p => p.stid === stid);
            if (index !== -1) {
                pieces.value[index] = response;
            }
            return response;
        } catch (e) {
            error.value = 'Failed to update piece';
            console.error('Error updating piece:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const deletePiece = async (stid: number) => {
        loading.value = true;
        error.value = null;
        try {
            await $fetch('/api/pieces', {
                method: 'DELETE',
                body: { stid }
            });
            pieces.value = pieces.value.filter(p => p.stid !== stid);
        } catch (e) {
            error.value = 'Failed to delete piece';
            console.error('Error deleting piece:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const exportPieces = async () => {
        try {
            const { data } = await useFetch('/api/pieces');
            if (data.value) {
                const blob = new Blob([JSON.stringify(data.value, null, 4)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'pieces.json';
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            error.value = 'Failed to export pieces';
            console.error('Error exporting pieces:', err);
            throw err;
        }
    };

    const importPieces = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const { data } = await useFetch('/api/pieces/import', {
                method: 'POST',
                body: formData
            });
            
            if (data.value) {
                pieces.value = data.value.pieces;
            }
        } catch (err) {
            error.value = 'Failed to import pieces';
            console.error('Error importing pieces:', err);
            throw err;
        }
    };

    return {
        pieces,
        loading,
        error,
        fetchPieces,
        fetchPieceById,
        createPiece,
        updatePiece,
        deletePiece,
        exportPieces,
        importPieces
    };
};
