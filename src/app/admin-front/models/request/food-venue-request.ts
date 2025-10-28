import Address from "./address";
import { VenueStyle } from "./venue-style";


export interface FoodVenueRequest {
  name: string;
  address: Address;
  email: string;
  phone: string;
  imageUrl?: string;
  styleRequestDto: VenueStyle;
}
