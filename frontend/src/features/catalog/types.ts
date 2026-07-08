// Public (storefront) catalog types — only the fields the API exposes to visitors.

export interface CatalogProduct {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	descriptionUz: string;
	descriptionRu: string;
	descriptionEn: string;
	image: string;
	images?: string[];
	isOriginal?: boolean;
	types: string[];
	subtypes: string[];
	sellPrice: number;
	owner?: { id: string; name: string };
}

export interface CatalogSubcategory {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
}

export interface CatalogCategory {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
	subcategories?: CatalogSubcategory[];
}
