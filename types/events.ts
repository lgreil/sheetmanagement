export interface EventPiece {
    composer?: string;
    title: string;
}

export interface Event {
    id: string;
    title: string;
    year?: number;
    start_date?: string;
    end_date?: string;
    type: 'concert' | 'concert_tour' | 'rehearsal' | 'other';
    location: string;
    program: EventPiece[];
    collections?: string[];
    additional_pieces?: EventPiece[];
    notes?: string;
}
