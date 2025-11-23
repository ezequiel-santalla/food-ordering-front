export interface DiningTableRequest {
  number: number;
  capacity: number | null;
  status?: string;
}

export interface DiningTableResponse {
  publicId: string;
  number: number;
  capacity: number;
  status: string;
}

export enum DiningTableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
// public enum DiningTableStatus {

//     AVAILABLE,
//     IN_SESSION,
//     COMPLETE,
//     WAITING_RESET,
//     OUT_OF_SERVICE,
// }
