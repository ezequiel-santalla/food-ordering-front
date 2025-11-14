import {
  Menu,
  MenuElement,
  Subcategory,
  SubcategoryNested,
  Product,
} from '../../models/menu.interface';

export type MenuNode = {
  name: string;
  subcategory?: MenuNode[];
  products?: Product[];
};

export function buildMenuTree(menuData: Menu): { menu: MenuNode[] } {
  const transformNode = (
    node: MenuElement | Subcategory | SubcategoryNested
  ): MenuNode => ({
    name: node.category,
    products: node.products ?? [],
    subcategory:
      (node as any).subcategory?.map((sub: any) => transformNode(sub)) ?? [],
  });

  return {
    menu: menuData.menu.map(transformNode),
  };
}
