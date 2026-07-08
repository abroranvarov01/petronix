"use client";

import { useCallback, useRef, useState } from "react";
import { API_URL, imgUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface MultiImageUploadProps {
  value: string[];
  onChange: (paths: string[]) => void;
  onError?: (msg: string) => void;
  max?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

// Gallery uploader — several photos per product. The first image is the primary
// one (used on cards/cart); drag isn't needed, order follows upload order.
export default function MultiImageUpload({ value, onChange, onError, max = 8 }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0); // count of in-flight uploads

  const uploadOne = useCallback((file: File): Promise<string | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.("Faqat JPEG, PNG va WebP formatlar");
      return Promise.resolve(null);
    }
    if (file.size > MAX_SIZE) {
      onError?.("Fayl hajmi 5 MB dan oshmasligi kerak");
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const fd = new FormData();
      fd.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data.path);
          else { onError?.(data.message ?? "Yuklashda xatolik"); resolve(null); }
        } catch { onError?.("Server xatosi"); resolve(null); }
      });
      xhr.addEventListener("error", () => { onError?.("Tarmoq xatosi"); resolve(null); });
      xhr.open("POST", `${API_URL}/upload`);
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(fd);
    });
  }, [onError]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = max - value.length;
    if (room <= 0) { onError?.(`Maksimal ${max} ta rasm`); return; }
    const list = Array.from(files).slice(0, room);
    setUploading((n) => n + list.length);
    const uploaded: string[] = [];
    for (const f of list) {
      const path = await uploadOne(f);
      if (path) uploaded.push(path);
      setUploading((n) => n - 1);
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  }, [value, max, onChange, onError, uploadOne]);

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...value];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  return (
    <div className="mimg-root">
      <div className="mimg-grid">
        {value.map((src, i) => (
          <div key={src + i} className={`mimg-item${i === 0 ? " is-primary" : ""}`}>
            <img src={imgUrl(src)} alt="" />
            {i === 0 && <span className="mimg-badge">Asosiy</span>}
            <div className="mimg-item-actions">
              {i > 0 && (
                <button type="button" title="Chapga" onClick={() => move(i, -1)}>‹</button>
              )}
              {i < value.length - 1 && (
                <button type="button" title="O'ngga" onClick={() => move(i, 1)}>›</button>
              )}
              <button type="button" className="mimg-del" title="O'chirish" onClick={() => remove(i)}>✕</button>
            </div>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            className={`mimg-add${dragging ? " is-dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
          >
            {uploading > 0 ? (
              <span className="mimg-add-hint">{uploading} yuklanmoqda…</span>
            ) : (
              <>
                <span className="mimg-add-icon">＋</span>
                <span className="mimg-add-hint">Rasm qo'shish</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="mimg-note">JPEG, PNG, WebP · maks {max} ta · birinchi rasm — asosiy</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
