// Domain types for the admin panel.

export interface AuthUser {
	id: string;
	email: string;
	role: string;
}

export type AdminTab = "products" | "orders" | "warehouse" | "reports" | "categories" | "banners" | "users";

export interface Product {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	descriptionUz: string;
	descriptionRu: string;
	descriptionEn: string;
	// Category slugs — a product can belong to several categories.
	types: string[];
	subtypes: string[];
	image: string;
	images?: string[];
	costPrice: number;
	sellPrice: number;
	wholesalePrice: number;
	ownerId?: string;
	owner?: { id: string; name: string };
}

export interface Subcategory {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
	image: string;
	order: number;
	categoryId: string;
}

export interface Category {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
	image: string;
	order: number;
	subcategories?: Subcategory[];
}

export interface Banner {
	id: string;
	image: string;
	link: string;
	order: number;
}

export interface OrderItem {
	id: string;
	// Null when the product was deleted after the order was placed.
	productId: string | null;
	sellerId?: string | null;
	nameSnapshot: string;
	qty: number;
	unitPrice: number;
	subtotal: number;
}

export interface Payment {
	id: string;
	status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
	amount: number;
	method: string;
}

export interface Order {
	id: string;
	status: "NEW" | "CONFIRMED" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";
	customerName: string;
	customerPhone: string;
	address: string;
	comment: string;
	total: number;
	items: OrderItem[];
	payment?: Payment | null;
	createdAt: string;
}

export interface StockRow {
	id: string;
	productId: string;
	quantity: number;
	minQuantity: number;
	product: { id: string; nameUz: string; nameRu: string; nameEn: string; unit: string; costPrice: number; ownerId?: string };
	warehouse: { id: string; name: string };
}

export interface Movement {
	id: string;
	type: "RECEIPT" | "SALE" | "WRITE_OFF" | "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT";
	qty: number;
	unitCost: number;
	reason: string;
	createdAt: string;
	product: { nameUz: string; nameRu: string; nameEn: string };
}

export interface Supplier {
	id: string;
	name: string;
	phone: string;
	note: string;
}

export interface AdminUser {
	id: string;
	email: string;
	name: string;
	role: "ADMIN" | "DEALER";
	status: "PENDING" | "APPROVED" | "BLOCKED";
	createdAt: string;
	_count?: { products: number };
}
