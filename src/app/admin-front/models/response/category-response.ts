export default interface CategoryResponse {
    publicId: string;
    name: string;
    childrenCategories: CategoryResponse[];
    id:string;
}
