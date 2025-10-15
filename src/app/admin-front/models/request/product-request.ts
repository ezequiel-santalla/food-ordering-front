export default interface ProductRequest {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    imageUrl?: string;

    categoryId?: string;
    tagsId?: number[];
}
