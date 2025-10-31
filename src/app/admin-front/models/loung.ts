
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


export interface TablePosition {
  diningTableId: string;
  positionX: number;
  positionY: number;
  sector: string;
}

export interface TablePositionResponse {
  publicId: string;
  diningTableId: string;
  diningTableNumber: number;
  diningTableCapacity: number;
  diningTableStatus: string;
  positionX: number;
  positionY: number;
  sector: string;
}
