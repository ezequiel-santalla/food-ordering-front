import Address from "../request/address";
import { VenueStyle } from "../request/venue-style";

export interface FoodVenueAdminResponse {
    publicId: string;
    name: string;
    email: string;
    phone: string;
    imageUrl: string;
    address: Address;
    creationDate: string;
    lastUpdateDate: string;
    numberOfEmployees: number;
    numberOfTables: number;
    venueStyle: VenueStyle;
}
