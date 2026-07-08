"use client";

import { useEffect, useState } from "react";
import { imgUrl } from "@/lib/api";

// Marketplace-style gallery: a large main image with a vertical thumbnail strip.
// Falls back gracefully when a product has 0 or 1 images.
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
	const [active, setActive] = useState(0);

	// Reset selection if the product (and thus the image set) changes.
	useEffect(() => {
		setActive(0);
	}, [images.join("|")]);

	if (images.length === 0) {
		return <div className="pdp-gallery-main pdp-gallery-empty" />;
	}

	const main = images[Math.min(active, images.length - 1)];

	return (
		<div className="pdp-gallery">
			{images.length > 1 && (
				<div className="pdp-thumbs">
					{images.map((src, i) => (
						<button
							key={src + i}
							type="button"
							className={`pdp-thumb${i === active ? " is-active" : ""}`}
							onMouseEnter={() => setActive(i)}
							onClick={() => setActive(i)}
							aria-label={`${alt} — ${i + 1}`}
						>
							<img src={imgUrl(src)} alt="" />
						</button>
					))}
				</div>
			)}
			<div className="pdp-gallery-main">
				<img src={imgUrl(main)} alt={alt} />
			</div>
		</div>
	);
}
