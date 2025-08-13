// Auto-generated categories data from Categories.xlsx
export interface Category {
  name: string;
  id?: string;
  children: Category[];
}

// Import the JSON data at build time
import categoriesData from './categories.json';

export const categories: Category[] = categoriesData as Category[];

export default categories;
