// Shared labels and form templates for the admin panel.

export const MOVEMENT_LABEL: Record<string, string> = {
	RECEIPT: "Kirim", SALE: "Sotuv", WRITE_OFF: "Hisobdan chiqarish",
	TRANSFER_IN: "Ko'chirish (+)", TRANSFER_OUT: "Ko'chirish (−)", ADJUSTMENT: "Tuzatish",
};

export const ORDER_STATUSES = ["NEW", "CONFIRMED", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;
export const ORDER_STATUS_LABEL: Record<string, string> = {
	NEW: "Yangi", CONFIRMED: "Tasdiqlangan", PAID: "To'langan",
	SHIPPED: "Jo'natilgan", COMPLETED: "Bajarilgan", CANCELLED: "Bekor qilingan",
};

export const EMPTY_PRODUCT = {
	nameUz: "", nameRu: "", nameEn: "",
	descriptionUz: "", descriptionRu: "", descriptionEn: "",
	brand: [] as string[],
	type: "",
	subtypes: [] as string[],
	image: "",
	costPrice: 0,
	sellPrice: 0,
	wholesalePrice: 0,
};
export type ProductFormData = typeof EMPTY_PRODUCT;

export const EMPTY_CATEGORY = { nameUz: "", nameRu: "", nameEn: "", name: "", slug: "", image: "", order: 0 };
export type CategoryFormData = typeof EMPTY_CATEGORY;

export const EMPTY_SUBCATEGORY = { nameUz: "", nameRu: "", nameEn: "", name: "", slug: "", image: "", order: 0, categoryId: "" };
export type SubcategoryFormData = typeof EMPTY_SUBCATEGORY;

export type Lang = "uz" | "ru" | "en";
export const LANGS: { key: Lang; label: string; flag: string }[] = [
	{ key: "uz", label: "O'zbek", flag: "🇺🇿" },
	{ key: "ru", label: "Русский", flag: "🇷🇺" },
	{ key: "en", label: "English", flag: "🇬🇧" },
];
