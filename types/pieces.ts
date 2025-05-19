export interface Person {
    pid: number;
    vorname?: string;
    name: string;
}

export interface Piece {
    stid: number;
    name: string;
    genre?: string;
    jahr?: number;
    schwierigkeit?: string;
    isdigitalisiert?: boolean;
    arrangiert: Person[];
    komponiert: Person[];
}

export interface NewPiece extends Omit<Piece, 'stid'> {}

export interface Attachment {
    id: number;
    name: string;
    url: string;
    type: string;
    size?: number;
    uploadDate?: string;
}
