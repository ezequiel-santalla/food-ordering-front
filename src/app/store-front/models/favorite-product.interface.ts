export type FavoriteIdsResponseDto = {
  foodVenueId: string;
  productIds: string[];
};

export type FavoriteToggleResponseDto = {
  foodVenueId: string;
  productId: string;
  isFavorite: boolean;
};
