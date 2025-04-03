export interface Piece {
  stid: number;
  name: string;
  genre?: string | null;
  jahr?: number | null;
  schwierigkeit?: string | null;
  isdigitalisiert?: boolean | null;
  arrangiert: {
    pid: number;
    vorname: string | null;
    name: string | null;
  }[];
  komponiert: {
    pid: number;
    vorname: string | null;
    name: string | null;
  }[];
} 