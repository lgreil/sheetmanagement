export interface Person {
    pid: number;
    vorname: string;
    name: string;
}

export interface Piece {
    stid: number;
    name: string;
    genre: string;
    jahr: number | null;
    schwierigkeit: string | null;
    isdigitalisiert: boolean | null;
    arrangiert: Person[];
    komponiert: Person[];
}