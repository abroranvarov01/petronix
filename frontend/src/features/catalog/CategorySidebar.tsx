"use client";

import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { localizedName } from "@/lib/localized";
import type { CatalogCategory } from "./types";

interface CategorySidebarProps {
	categories: CatalogCategory[];
	lang: Lang;
	selectedType: string | null;
	selectedSubtypes: string[];
	expandedCats: Set<string>;
	onSelectCategory: (slug: string | null) => void;
	onToggleSubtype: (slug: string) => void;
}

export function CategorySidebar({
	categories, lang, selectedType, selectedSubtypes, expandedCats, onSelectCategory, onToggleSubtype,
}: CategorySidebarProps) {
	const t = useT();

	return (
		<aside className="catalog-aside">
			<h3 className="catalog-aside-title">{t("prod_categories")}</h3>
			<button
				className={`cat-link${!selectedType ? " active" : ""}`}
				onClick={() => onSelectCategory(null)}
			>
				{t("prod_all")}
			</button>
			{categories.map((cat) => {
				const isActive = selectedType === cat.slug;
				const isExpanded = expandedCats.has(cat.slug);
				const subs = cat.subcategories ?? [];
				return (
					<div key={cat.id} className="cat-group">
						<button
							className={`cat-link${isActive ? " active" : ""}${isExpanded ? " expanded" : ""}`}
							onClick={() => onSelectCategory(cat.slug)}
						>
							<span className="cat-link-label">{localizedName(cat, lang)}</span>
							{subs.length > 0 && (
								<svg className="cat-link-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
							)}
						</button>
						{isExpanded && subs.length > 0 && (
							<div className="cat-sublist">
								{subs.map((sub) => (
									<button
										key={sub.id}
										className={`cat-sublink${selectedSubtypes.includes(sub.slug) ? " active" : ""}`}
										onClick={() => onToggleSubtype(sub.slug)}
									>
										{localizedName(sub, lang)}
									</button>
								))}
							</div>
						)}
					</div>
				);
			})}
		</aside>
	);
}
