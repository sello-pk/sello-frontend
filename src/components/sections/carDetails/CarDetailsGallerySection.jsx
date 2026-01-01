import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaBookmark,
  FaRegBookmark,
  FaChevronRight,
  FaChevronLeft,
  FaTimes,
  FaSearchPlus,
  FaSearchMinus,
  FaExpand,
} from "react-icons/fa";
import { CiImageOn } from "react-icons/ci";
import { useParams, useLocation } from "react-router-dom";
import {
  useGetSingleCarQuery,
  useSaveCarMutation,
  useUnsaveCarMutation,
  useGetSavedCarsQuery,
} from "../../../redux/services/api";
import { images as placeholderImages } from "../../../assets/assets";
import LazyImage from "../../common/LazyImage";
import toast from "react-hot-toast";
import { extractCarIdFromSlug } from "../../../utils/urlBuilders";

const CarDetailsGallerySection = () => {
  const { id: routeParam } = useParams();
  const extractedCarId = extractCarIdFromSlug(routeParam);
  const {
    data: car,
    isLoading,
    error,
  } = useGetSingleCarQuery(extractedCarId, {
    skip: !extractedCarId,
  });

  const token = localStorage.getItem("token");
  const { data: savedCarsData } = useGetSavedCarsQuery(undefined, {
    skip: !token,
  });
  const [saveCar, { isLoading: isSaving }] = useSaveCarMutation();
  const [unsaveCar, { isLoading: isUnsaving }] = useUnsaveCarMutation();

  // Check if car is saved
  const savedCars = useMemo(() => {
    if (!savedCarsData || !Array.isArray(savedCarsData)) return [];
    return savedCarsData.map((c) => c._id || c.id).filter(Boolean);
  }, [savedCarsData]);
  const isSaved = car?._id ? savedCars.includes(car._id) : false;

  // Filter out empty image strings and provide fallback
  const images = useMemo(() => {
    if (!car?.images || !Array.isArray(car.images)) {
      return [placeholderImages.carPlaceholder];
    }
    const validImages = car.images.filter((img) => img && img.trim() !== "");
    return validImages.length > 0
      ? validImages
      : [placeholderImages.carPlaceholder];
  }, [car?.images]);

  const [current, setCurrent] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const mainImageRef = useRef(null);
  const modalImageRef = useRef(null);

  // Reset modal state on mount/route change - ensure modal is closed
  useEffect(() => {
    // Force close modal and restore body styles on mount
    setIsImageModalOpen(false);
    if (document.body) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, []);

  // Auto-scroll thumbnail to current image
  const thumbnailRefs = useRef([]);

  useEffect(() => {
    if (thumbnailRefs.current[current]) {
      thumbnailRefs.current[current].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [current]);

  // Handle keyboard navigation in modal - ONLY when modal is open
  useEffect(() => {
    if (!isImageModalOpen) {
      // No event listeners when modal is closed
      return;
    }

    const handleKeyPress = (e) => {
      // Double check modal is still open
      if (!isImageModalOpen) return;

      // Only prevent default for keys we handle
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Escape" ||
        e.key === "+" ||
        e.key === "=" ||
        e.key === "-"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "ArrowLeft") {
        handlePrevModalImage();
      } else if (e.key === "ArrowRight") {
        handleNextModalImage();
      } else if (e.key === "Escape") {
        closeImageModal();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    // Use bubbling phase, not capture, to avoid blocking other events
    window.addEventListener("keydown", handleKeyPress, false);
    return () => {
      window.removeEventListener("keydown", handleKeyPress, false);
    };
  }, [isImageModalOpen, modalCurrentIndex, zoomLevel]);

  // Handle mouse wheel zoom in modal
  useEffect(() => {
    if (!isImageModalOpen || !modalImageRef.current) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    };

    const imageElement = modalImageRef.current;
    imageElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => imageElement.removeEventListener("wheel", handleWheel);
  }, [isImageModalOpen, zoomLevel]);

  // Cleanup effect to ensure body styles are restored on unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount - restore body styles (don't set state as component is unmounting)
      if (document.body) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
    };
  }, []);

  // Force close modal and restore body styles when route changes
  useEffect(() => {
    // Close modal immediately on route change
    if (isImageModalOpen) {
      setIsImageModalOpen(false);
    }
    // Always restore body styles on route change
    if (document.body) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, [location.pathname, location.key]);

  // Cleanup on unmount - ensure everything is reset
  useEffect(() => {
    return () => {
      setIsImageModalOpen(false);
      if (document.body) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
    };
  }, []);

  // Restore body styles when modal closes
  useEffect(() => {
    if (!isImageModalOpen && document.body) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, [isImageModalOpen]);

  const openImageModal = (index) => {
    setModalCurrentIndex(index);
    setIsImageModalOpen(true);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    // Prevent body scroll when modal is open
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    // Immediately restore body styles
    if (document.body) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    // Reset zoom state
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
    setIsPanning(false);
    setIsImageModalOpen(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
    // Ensure body overflow is restored
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };

  const handleNextModalImage = () => {
    const nextIndex = (modalCurrentIndex + 1) % images.length;
    setModalCurrentIndex(nextIndex);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  };

  const handlePrevModalImage = () => {
    const prevIndex = (modalCurrentIndex - 1 + images.length) % images.length;
    setModalCurrentIndex(prevIndex);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 1);
    setZoomLevel(newZoom);
    if (newZoom === 1) {
      setIsZoomed(false);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan handling
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const nextImage = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleSave = async (e) => {
    e.stopPropagation();
    if (!token) {
      toast.error("Please login to save cars");
      return;
    }

    try {
      if (isSaved) {
        await unsaveCar(car._id).unwrap();
        toast.success("Car removed from saved");
      } else {
        await saveCar(car._id).unwrap();
        toast.success("Car saved successfully");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update saved cars");
    }
  };

  if (isLoading) {
    return (
      <section className="px-4 md:px-20 py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-[300px] md:h-[600px] mb-4"></div>
            <div className="flex gap-2 overflow-x-auto">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded h-20 w-20 flex-shrink-0"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !car) {
    return (
      <section className="px-4 md:px-20 py-12 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-lg text-red-500">Failed to load car images.</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-20 py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout: Main Image + Thumbnails Side by Side */}
        <div className="hidden md:flex gap-4">
          {/* Thumbnails Column (Left) */}
          {images.length > 1 && (
            <div className="flex flex-col gap-2 w-24 flex-shrink-0">
              <div className="overflow-y-auto max-h-[450px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    ref={(el) => (thumbnailRefs.current[idx] = el)}
                    onClick={() => setCurrent(idx)}
                    className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 mb-2 ${
                      current === idx
                        ? "border-primary-500 ring-2 ring-primary-200 scale-105"
                        : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <LazyImage
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImages.carPlaceholder;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Image Area */}
          <div className="flex-1 relative rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            <div
              ref={mainImageRef}
              className="relative w-full h-[450px] cursor-zoom-in group"
              onClick={() => openImageModal(current)}
            >
              <LazyImage
                src={images[current]}
                alt={`Car Image ${current + 1}`}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholderImages.carPlaceholder;
                }}
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Image Count Badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
                <CiImageOn size={18} />
                <span>
                  {current + 1} / {images.length}
                </span>
              </div>

              {/* View All Button */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white">
                <FaExpand size={14} />
                <span>View All</span>
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <FaChevronLeft size={18} className="text-gray-800" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                    aria-label="Next image"
                  >
                    <FaChevronRight size={18} className="text-gray-800" />
                  </button>
                </>
              )}

              {/* Save/Bookmark Button */}
              <button
                onClick={toggleSave}
                disabled={isSaving || isUnsaving}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all disabled:opacity-50 z-10"
                title={isSaved ? "Remove from saved" : "Save car"}
              >
                {isSaved ? (
                  <FaBookmark className="text-primary-500" size={20} />
                ) : (
                  <FaRegBookmark className="text-gray-700" size={20} />
                )}
              </button>

              {/* Featured Badge */}
              {car?.featured && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg z-10">
                  <FaRegBookmark size={12} />
                  FEATURED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout: Main Image + Thumbnails Below */}
        <div className="md:hidden">
          {/* Main Image */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-lg mb-4">
            <div
              className="relative w-full h-[300px] cursor-pointer"
              onClick={() => openImageModal(current)}
            >
              <LazyImage
                src={images[current]}
                alt={`Car Image ${current + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholderImages.carPlaceholder;
                }}
              />

              {/* Image Count */}
              <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {current + 1} / {images.length}
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg"
                  >
                    <FaChevronLeft size={16} className="text-gray-800" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg"
                  >
                    <FaChevronRight size={16} className="text-gray-800" />
                  </button>
                </>
              )}

              {/* Save Button */}
              <button
                onClick={toggleSave}
                disabled={isSaving || isUnsaving}
                className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-lg disabled:opacity-50"
              >
                {isSaved ? (
                  <FaBookmark className="text-primary-500" size={18} />
                ) : (
                  <FaRegBookmark className="text-gray-700" size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    current === idx
                      ? "border-primary-500 ring-2 ring-primary-200"
                      : "border-gray-200"
                  }`}
                >
                  <LazyImage
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImages.carPlaceholder;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Full Screen Lightbox Modal - Using Portal - Only render when open */}
        {isImageModalOpen &&
        typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        document.body
          ? createPortal(
              <div
                className="fixed inset-0 z-[9999] bg-black flex flex-col"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    closeImageModal();
                  }
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                role="dialog"
                aria-modal="true"
                aria-label="Image gallery modal"
                style={{ display: isImageModalOpen ? "flex" : "none" }}
              >
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomOut();
                        }}
                        disabled={zoomLevel <= 1}
                        className="text-white hover:text-gray-300 disabled:opacity-50 p-2"
                        title="Zoom Out"
                      >
                        <FaSearchMinus size={16} />
                      </button>
                      <span className="text-white text-sm px-2 min-w-[60px] text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomIn();
                        }}
                        disabled={zoomLevel >= 3}
                        className="text-white hover:text-gray-300 disabled:opacity-50 p-2"
                        title="Zoom In"
                      >
                        <FaSearchPlus size={16} />
                      </button>
                      {zoomLevel > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetZoom();
                          }}
                          className="text-white hover:text-gray-300 text-xs px-2 py-1 border border-white/30 rounded ml-2"
                          title="Reset Zoom"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Image Counter */}
                    <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                      <CiImageOn size={18} />
                      <span>
                        {modalCurrentIndex + 1} / {images.length}
                      </span>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={closeImageModal}
                    className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-3 rounded-full transition-all"
                    aria-label="Close"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Main Image Container */}
                <div
                  className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={handleMouseDown}
                >
                  <div
                    className={`transition-all duration-300 ${
                      isZoomed ? "cursor-move" : "cursor-zoom-in"
                    }`}
                    style={{
                      transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <img
                      ref={modalImageRef}
                      src={images[modalCurrentIndex]}
                      alt={`Car Image ${modalCurrentIndex + 1}`}
                      className="max-w-full max-h-[calc(100vh-200px)] object-contain select-none"
                      draggable={false}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImages.carPlaceholder;
                      }}
                    />
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevModalImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all z-10 hover:scale-110"
                        aria-label="Previous image"
                      >
                        <FaChevronLeft size={24} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextModalImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all z-10 hover:scale-110"
                        aria-label="Next image"
                      >
                        <FaChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip at Bottom */}
                {images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent justify-center">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalCurrentIndex(idx);
                              setZoomLevel(1);
                              setPanPosition({ x: 0, y: 0 });
                              setIsZoomed(false);
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              modalCurrentIndex === idx
                                ? "border-primary-500 ring-2 ring-primary-200 opacity-100 scale-110"
                                : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/50"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = placeholderImages.carPlaceholder;
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>,
              document.body
            )
          : null}

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </section>
  );
};

export default CarDetailsGallerySection;
