// src/components/createPost/ImagesUpload.js
import React, { useState, useRef } from "react";

const ImagesUpload = ({ onImagesChange }) => {
  const [uploads, setUploads] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    processFiles(files);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length > 0) processFiles(files);
  };

  // Process selected files - optimized with validation
  const processFiles = (files) => {
    // Validate file types and sizes
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxFiles = 20;

    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        return false;
      }
      if (file.size > maxSize) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Check total file count
    const currentCount = uploads.length;
    if (currentCount + validFiles.length > maxFiles) {
      const remainingSlots = maxFiles - currentCount;
      if (remainingSlots > 0) {
        validFiles.splice(remainingSlots);
      } else {
        return;
      }
    }

    const newUploads = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));

    setUploads((prev) => {
      const updated = [...prev, ...newUploads];
      // Pass all files to parent component
      if (onImagesChange) {
        onImagesChange(updated.map((u) => u.file));
      }
      return updated;
    });

    newUploads.forEach((upload) => simulateUpload(upload));
  };

  // Fake upload animation
  const simulateUpload = (upload) => {
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      setUploads((prev) =>
        prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
      );

      if (progress < 100) {
        requestAnimationFrame(animate);
      } else {
        setUploads((prev) => {
          const updated = prev.map((u) =>
            u.id === upload.id ? { ...u, progress: 100, status: "done" } : u
          );

          // set first image active automatically
          if (activeIndex === null) {
            const newIndex = updated.findIndex((u) => u.id === upload.id);
            setActiveIndex(newIndex);
          }
          return updated;
        });
      }
    };

    requestAnimationFrame(animate);
  };

  // ✅ Fixed Remove Function
  const removeFile = (id) => {
    setUploads((prev) => {
      const indexToRemove = prev.findIndex((u) => u.id === id);

      if (indexToRemove === -1) return prev;

      // free memory
      URL.revokeObjectURL(prev[indexToRemove].preview);

      const newUploads = prev.filter((u) => u.id !== id);

      // Update parent component with remaining files
      if (onImagesChange) {
        onImagesChange(newUploads.map((u) => u.file));
      }

      // Fix activeIndex after removal
      if (newUploads.length === 0) {
        setActiveIndex(null);
      } else if (activeIndex === indexToRemove) {
        setActiveIndex(0); // reset to first image
      } else if (activeIndex > indexToRemove) {
        setActiveIndex((prevIndex) => prevIndex - 1);
      }

      return newUploads;
    });
  };

  const completedUploads = uploads.filter((u) => u.status === "done");

  return (
    <div className="max-w-2xl mx-auto  rounded-xl  overflow-hidden">
      <div
        className={`relative px-6 py-14 transition-all duration-300 ${
          isDragging
            ? "bg-primary-300 ring-4 ring-primary-300 ring-opacity-50"
            : "bg-gray-100"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="box md:h-16 md:w-16 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 absolute top-9 z-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-gray-300"></div>
        {/* Preview */}
        <div className="bg-white rounded-xl  border-2 border-primary-300 border-dashed  h-64 flex items-center justify-center  overflow-hidden group relative">
          {activeIndex !== null ? (
            <>
              <img
                src={uploads[activeIndex]?.preview}
                alt="preview"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              {/* Remove Button */}
              <button
                onClick={() => removeFile(uploads[activeIndex].id)}
                className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 shadow"
              >
                Remove
              </button>
            </>
          ) : (
            <div className="text-center p-6">
              <p className="text-primary-500 text-sm">No image uploaded yet</p>
            </div>
          )}
        </div>

        {/* Uploading Progress */}
        <div className="mt-6 space-y-3">
          {uploads
            .filter((u) => u.status === "uploading")
            .map((upload) => (
              <div
                key={upload.id}
                className="bg-white p-3 shadow-sm border rounded"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700">
                    {upload.file.name}
                  </span>
                  <span className="text-xs text-primary-500 font-semibold">
                    {Math.round(upload.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-300 transition-all"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
            ))}
        </div>

        {/* Upload button */}
        <div className="mt-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-500 hover:scale-x-110 rounded-lg cursor-pointer hover:bg-gradient-to-l transition"
          >
            Select Images
          </label>
        </div>

        {/* Navigation dots */}
        {completedUploads.length > 0 && (
          <div className="flex justify-center mt-6 gap-2">
            {uploads.map(
              (upload, idx) =>
                upload.status === "done" && (
                  <button
                    key={upload.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-3 h-3 rounded-full ${
                      activeIndex === idx
                        ? "bg-gradient-to-r from-primary-400 to-primary-500 shadow"
                        : "bg-gray-400"
                    }`}
                  />
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesUpload;
