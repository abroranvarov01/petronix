"use client";

import { useState, useRef, useCallback } from "react";
import { API_URL, imgUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { compressImage } from "@/lib/image";

interface ImageUploadProps {
  value: string;
  onChange: (path: string) => void;
  onError?: (msg: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [localPreview, setLocalPreview] = useState<string>("");

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return "Faqat JPEG, PNG va WebP formatlar";
    if (file.size > 30 * 1024 * 1024) return "Fayl hajmi juda katta (30 MB)";
    return null;
  }

  const upload = useCallback(async (original: File) => {
    const err = validate(original);
    if (err) { onError?.(err); return; }

    // Local preview immediately (from the original — instant, no wait)
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(original);

    // Shrink + re-encode in the browser so we never hit the proxy body limit.
    const file = await compressImage(original);
    if (file.size > MAX_SIZE) { onError?.("Rasm hajmi juda katta"); setLocalPreview(""); return; }

    // XHR for progress tracking
    const fd = new FormData();
    fd.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      setProgress(null);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onChange(data.path);
        } else {
          onError?.(data.error ?? "Yuklashda xatolik");
          setLocalPreview("");
        }
      } catch {
        onError?.("Server xatosi");
        setLocalPreview("");
      }
    });

    xhr.addEventListener("error", () => {
      setProgress(null);
      setLocalPreview("");
      onError?.("Tarmoq xatosi");
    });

    xhr.open("POST", `${API_URL}/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(fd);
    setProgress(0);
  }, [onChange, onError]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleClear() {
    onChange("");
    setLocalPreview("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayImage = localPreview || imgUrl(value);
  const isUploading = progress !== null;

  return (
    <div className="upload-root">
      {displayImage ? (
        <div className="upload-preview">
          <img src={displayImage} alt="preview" className="upload-preview-img" />

          {isUploading && (
            <div className="upload-overlay">
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="upload-progress-label">{progress}%</span>
            </div>
          )}

          {!isUploading && (
            <div className="upload-preview-actions">
              <button
                type="button"
                className="upload-change-btn"
                onClick={() => inputRef.current?.click()}
              >
                ↺ Almashtirish
              </button>
              <button
                type="button"
                className="upload-remove-btn"
                onClick={handleClear}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`upload-dropzone${dragging ? " is-dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="upload-uploading">
              <div className="upload-progress-track">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="upload-progress-label">{progress}% yuklanmoqda...</span>
            </div>
          ) : (
            <>
              <div className="upload-icon">🖼</div>
              <p className="upload-hint-main">
                {dragging ? "Tashlang!" : "Rasm tanlang yoki shu yerga tashlang"}
              </p>
              <p className="upload-hint-sub">JPEG, PNG, WebP · Maks 5 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}