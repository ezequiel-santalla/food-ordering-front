// Lounge Models
export interface LoungeRequest {
  name: string;
  gridWidth?: number;
  gridHeight?: number;
}

export interface LoungeResponse {
  publicId: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  tablePositions: TablePositionResponse[];
}

// Table Position Models
export interface TablePosition {
  diningTableId: string;
  positionX: number;
  positionY: number;
  sector: string;
  tableShape: string; // 'round', 'square', 'rect'
  width?: number;
  height?: number;
}

export interface TablePositionResponse {
  publicId: string;
  diningTableId: string;
  diningTableNumber: number;
  diningTableCapacity: number | null;
  diningTableStatus: DiningTableStatus;
  positionX: number;
  positionY: number;
  sector: string;
  tableShape: string;
  width: number;
  height: number;
}

export interface SectorResponse {
  sectors: string[];
}

export enum DiningTableStatus {
  AVAILABLE = 'AVAILABLE',
  IN_SESSION = 'IN_SESSION',
  COMPLETE = 'COMPLETE',
  WAITING_RESET = 'WAITING_RESET',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
