export interface VenueStyle {
  logoUrl: string;
  bannerUrl: string;
  description: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;

  // Campos del DTO no visibles en la UI actual, pero necesarios para el modelo
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  slogan?: string;
  publicMenu?: boolean;
}
