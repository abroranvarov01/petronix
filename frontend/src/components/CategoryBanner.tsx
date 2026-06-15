"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { API_URL, imgUrl } from "@/lib/api";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./CategoryBanner.css";

interface Banner {
  id: string;
  image: string;
  link: string;
  order: number;
}

export default function CategoryBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_URL}/banners`)
      .then((r) => r.json())
      .then((data: Banner[]) => {
        if (Array.isArray(data)) {
          setBanners(data.filter((b) => !!b.image));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const slides = banners.filter((b) => !brokenImgs.has(b.id));
  if (slides.length === 0) return null;

  return (
    <section className="cat-banner">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, el: ".cat-banner-dots" }}
        navigation={{ prevEl: ".cat-banner-prev", nextEl: ".cat-banner-next" }}
        loop={slides.length > 1}
        className="cat-swiper"
      >
        {slides.map((banner) => {
          const img = (
            <img
              src={imgUrl(banner.image)}
              alt=""
              className="cat-banner-img"
              onError={() =>
                setBrokenImgs((prev) => new Set(prev).add(banner.id))
              }
            />
          );

          return (
            <SwiperSlide key={banner.id}>
              {banner.link ? (
                <Link href={banner.link} className="cat-banner-slide">
                  {img}
                </Link>
              ) : (
                <div className="cat-banner-slide">{img}</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {slides.length > 1 && (
        <>
          <button className="cat-banner-arrow cat-banner-prev" aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="cat-banner-arrow cat-banner-next" aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="cat-banner-dots" />
        </>
      )}
    </section>
  );
}
