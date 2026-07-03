import type { Lang } from "@/lib/i18n";

interface LocalizedName {
	nameUz?: string;
	nameRu?: string;
	nameEn?: string;
	name?: string;
}

interface LocalizedDesc {
	descriptionUz?: string;
	descriptionRu?: string;
	descriptionEn?: string;
}

// Pick the name in the requested language, falling back uz → ru → en → name.
export function localizedName(obj: LocalizedName, lang: Lang): string {
	if (lang === "ru" && obj.nameRu) return obj.nameRu;
	if (lang === "en" && obj.nameEn) return obj.nameEn;
	return obj.nameUz || obj.nameRu || obj.nameEn || obj.name || "";
}

export function localizedDesc(obj: LocalizedDesc, lang: Lang): string {
	if (lang === "ru" && obj.descriptionRu) return obj.descriptionRu;
	if (lang === "en" && obj.descriptionEn) return obj.descriptionEn;
	return obj.descriptionUz || obj.descriptionRu || obj.descriptionEn || "";
}
