export interface EventPiece {
    composer?: string;
    title: string;
}

export interface SerializableDate {
    year: number;
    month: number;
    day: number;
}

export interface Event {
    id: string;
    name: string;
    date: string;
    time: string;
    type: 'concert' | 'concert_tour' | 'rehearsal' | 'other';
    location: string;
    program: EventPiece[];
    collections?: string[];
    additional_pieces?: EventPiece[];
    notes?: string;
    color?: string;
    description?: string;
    address?: string;
    participants?: string[];
    duration?: string;
}
