"use client";

import Link from "next/link";
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
	const href = `/products/${product.id}`;

	return (
		<div className="pcard">
			<Link href={href} className="pcard-img-wrap">
				{product.image ? (
					<img src={imgUrl(product.image)} alt={localizedName(product, lang)} className="pcard-img" />
				) : (
					<div className="pcard-img-placeholder" />
				)}
			</Link>
			<div className="pcard-body">
				<Link href={href} className="pcard-name-link">
					<h4 className="pcard-name">{localizedName(product, lang)}</h4>
				</Link>
				{product.sellPrice > 0 && (
					<p className="pcard-price">{formatUZS(product.sellPrice)}</p>
				)}
				{desc && <p className="pcard-desc">{desc}</p>}
				<div className="pcard-actions">
					<button className="pcard-buy" onClick={onOrder}>{t("prod_add_cart")}</button>
					<Link href={href} className="pcard-details">{t("prod_details")}</Link>
				</div>
			</div>
		</div>
	);
}
