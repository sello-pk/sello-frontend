import React, { useState, useEffect, useRef } from 'react';
import { useGetBannersQuery } from '../../redux/services/api';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const BannerCarousal = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef(null);
    
    // Fetch active banners from API
    const { data: bannersData, isLoading } = useGetBannersQuery({ 
        type: 'homepage', 
        position: 'hero',
        isActive: true 
    });
    
    const banners = bannersData || [];
    
    // Sort banners by order field
    const sortedBanners = [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Use banners if available, otherwise show nothing
    const slides = sortedBanners.length > 0 ? sortedBanners : [];

    // Auto-play functionality with pause on hover
    useEffect(() => {
        if (slides.length > 1 && !isPaused) {
            intervalRef.current = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 4000); // Change slide every 4 seconds

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [slides.length, isPaused]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
        // Reset auto-play timer when manually changing slide
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 2000);
    };

    const goToPrevious = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        // Reset auto-play timer
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 2000);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        // Reset auto-play timer
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 2000);
    };

    // Don't render if no banners or loading
    if (isLoading) {
        return (
            <section className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse">
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-gray-400 text-lg">Loading banners...</div>
                </div>
            </section>
        );
    }

    if (slides.length === 0) {
        return null; // Don't render if no banners
    }

    return (
        <section 
            className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gray-900"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Carousel Container */}
            <div className="relative w-full h-full">
                {slides.map((slide, index) => (
                    <div
                        key={slide._id || slide.id || index}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                            index === currentSlide 
                                ? 'opacity-100 scale-100 z-10' 
                                : 'opacity-0 scale-105 z-0'
                        }`}
                    >
                        {/* Banner Image Background */}
                        {slide.image ? (
                            <div 
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                style={{ 
                                    backgroundImage: `url(${slide.image})`,
                                    transition: 'transform 0.5s ease'
                                }}
                            >
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20"></div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600"></div>
                        )}
                        
                        {/* Content Overlay */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center px-4 md:px-8 lg:px-16">
                            <div className="text-center md:text-left max-w-4xl w-full">
                                {/* Title */}
                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 md:px-10 md:py-6 shadow-2xl border border-white/20 inline-block transform transition-all duration-500 hover:scale-105">
                                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3">
                                        {slide.title || "Welcome to Sello"}
                                    </h2>
                                    {slide.linkUrl && (
                                        <a 
                                            href={slide.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 mt-3 text-base md:text-lg text-primary-500 hover:text-primary-500 font-semibold transition-colors group"
                                        >
                                            Learn More 
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Arrows - Enhanced */}
                {slides.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            onMouseEnter={() => setIsPaused(true)}
                            className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl group"
                            aria-label="Previous slide"
                        >
                            <FaChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800 group-hover:text-primary-500 transition-colors" />
                        </button>
                        <button
                            onClick={goToNext}
                            onMouseEnter={() => setIsPaused(true)}
                            className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl group"
                            aria-label="Next slide"
                        >
                            <FaChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800 group-hover:text-primary-500 transition-colors" />
                        </button>
                    </>
                )}
            </div>

            {/* Pagination Dots - Enhanced */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-2 md:gap-3">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${
                                index === currentSlide
                                    ? 'w-3 h-3 md:w-3.5 md:h-3.5 bg-white shadow-lg'
                                    : 'w-2.5 h-2.5 md:w-3 md:h-3 bg-white/60 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default BannerCarousal;
