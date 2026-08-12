import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../stores/appStore";

export const UploadZone: React.FC = () => {
  const { setSelectedImage, selectedImage, clearImage } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSelectedImage({
          base64: e.target?.result as string,
          name: file.name,
          width: img.width,
          height: img.height,
          size: file.size,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files[0]) {
        handleFile(e.clipboardData.files[0]);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="fade-in">
      <div
        className={`upload-zone ${isDragging ? "upload-zone--dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="upload-zone__input"
        />
        {selectedImage ? (
          <div className="upload-zone__preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="upload-zone__preview">
              <img src={selectedImage.base64} alt="Preview" />
              <div className="upload-zone__preview-info">
                <span>{selectedImage.name}</span>
                <span>{selectedImage.width}x{selectedImage.height}</span>
              </div>
            </div>
            <button
              onClick={clearImage}
              className="btn btn--secondary btn--sm btn--full"
              style={{ marginTop: "12px" }}
            >
              Clear Image
            </button>
          </div>
        ) : (
          <>
            <span className="upload-zone__icon">📸</span>
            <h3 className="upload-zone__title">Upload or Paste UI Screenshot</h3>
            <p className="upload-zone__subtitle">
              Drag and drop an image here, or paste directly from clipboard
            </p>
            <div className="upload-zone__formats">
              <span className="upload-zone__format-tag">PNG</span>
              <span className="upload-zone__format-tag">JPG</span>
              <span className="upload-zone__format-tag">WebP</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
