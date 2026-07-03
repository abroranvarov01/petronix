"use client";

import { imgUrl } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { localizedDesc, localizedName } from "@/lib/localized";
import { formatUZS } from "@/lib/currency";
import type { CatalogProduct } from "./types";

export function ProductCard({ product, lang, onOrder }: {
	product: CatalogProduct; lang: Lang; onOrder: () => void;
}) {
	const t = useT();
	const desc = localizedDesc(product, lang);

	return (
		<div className="pcard">
			<div className="pcard-img-wrap">
				{product.image ? (
					<img src={imgUrl(product.image)} alt={localizedName(product, lang)} className="pcard-img" />
				) : (
					<div className="pcard-img-placeholder" />
				)}
			</div>
			<div className="pcard-body">
				<h4 className="pcard-name">{localizedName(product, lang)}</h4>
				{product.sellPrice > 0 && (
					<p className="pcard-price">{formatUZS(product.sellPrice)}</p>
				)}
				{desc && <p className="pcard-desc">{desc}</p>}
				<div className="pcard-actions">
					<button className="pcard-buy" onClick={onOrder}>{t("prod_add_cart")}</button>
					<button className="pcard-details">{t("prod_details") || "Подробнее"}</button>
				</div>
			</div>
		</div>
	);
}
