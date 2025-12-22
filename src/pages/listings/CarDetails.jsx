import React, { useEffect } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";
import { useGetSingleCarQuery } from "../../redux/services/api";
import { useRecentlyViewedCars } from "../../hooks/useRecentlyViewedCars";
import CarDetailsHeroSection from "../../components/sections/carDetails/CarDetailsHeroSection";
import CarDetailsGallerySection from "../../components/sections/carDetails/CarDetailsGallerySection";
import Btns from "../../components/sections/carDetails/Btns";
import CarDetailsEtc from "../../components/sections/carDetails/CarDetailsEtc";
import BrandMarquee from "../../components/BrandMarquee";
import { Link } from "react-router-dom";
import Ads from "../../components/utils/Ads";
import BlogSection from "../../components/sections/home/BlogSection";
import CustomerReviews from "../../components/sections/carDetails/CustomerReviews";
import Breadcrumb from "../../components/common/Breadcrumb";
import SimilarListings from "../../components/sections/carDetails/SimilarListings";
import RecentlyViewed from "../../components/sections/carDetails/RecentlyViewed";
import UserReviewSection from "../../components/reviews/UserReviewSection";
import SEO from "../../components/common/SEO";
import StructuredData from "../../components/common/StructuredData";

const CarDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  
  // CRITICAL: Get actual URL from window to verify route
  const actualPath = typeof window !== 'undefined' ? window.location.pathname : location.pathname;
  
  // ABSOLUTE CHECK - If we're on home route, return null immediately
  // Check both location.pathname AND window.location.pathname
  if (location.pathname === '/' || location.pathname === '/home' || 
      actualPath === '/' || actualPath === '/home') {
    return null;
  }
  
  // Double check - ensure we're on a valid car route
  // Use actualPath for verification
  const pathToCheck = actualPath || location.pathname;
  const pathParts = pathToCheck.split('/').filter(Boolean);
  
  const isValidCarRoute = 
    pathToCheck.startsWith('/cars/') &&
    pathToCheck !== '/cars' &&
    pathParts.length === 2 &&
    pathParts[0] === 'cars' &&
    pathParts[1] &&
    pathParts[1].trim() !== '' &&
    id &&
    typeof id === 'string' &&
    id.trim() !== '' &&
    id === pathParts[1];
  
  // If not valid, return null immediately
  if (!isValidCarRoute) {
    return null;
  }
  
  // Query will only run if we have a valid id
  const { data: car, isLoading, error } = useGetSingleCarQuery(id, {
    skip: !id || !isValidCarRoute,
  });
  const { addRecentlyViewed } = useRecentlyViewedCars();

  // Track car as recently viewed when it loads
  useEffect(() => {
    if (car && car._id) {
      addRecentlyViewed(car);
    }
  }, [car, addRecentlyViewed]);

  // Scroll to top when component mounts or route changes
  useEffect(() => {
    // Scroll to top immediately when navigating to car details page
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [id, location.pathname]);

  // Ensure body overflow is restored when leaving this page
  useEffect(() => {
    // Restore body styles on mount and when location changes
    if (document.body) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      // Cleanup: ensure body styles are restored when component unmounts
      if (document.body) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [location.pathname]);
  
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Cars', path: '/cars' },
    { label: car ? `${car.make || ''} ${car.model || ''}`.trim() || 'Car Details' : 'Car Details', path: `/cars/${id}` }
  ];

  if (error) {
    console.error("Car details error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Error loading car details</p>
          <p className="text-gray-600 text-sm mb-4">
            {error?.data?.message || error?.message || "Please try again later"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!car && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Car not found</p>
          <p className="text-gray-600 text-sm mb-4">
            The car listing you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Wait for car data before rendering
  if (isLoading || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-primary-500 mx-auto mb-4"></div>
          <div className="text-gray-500 text-sm">Loading car details...</div>
        </div>
      </div>
    );
  }

  const carTitle = car ? `${car.year || ''} ${car.make || ''} ${car.model || ''} - ${car.condition || ''} - AED ${car.price?.toLocaleString() || '0'}`.trim() : 'Car Details';
  const carDescription = car 
    ? `View details for ${car.year || ''} ${car.make || ''} ${car.model || ''} in ${car.city || ''}. ${car.condition || ''} car with ${car.mileage?.toLocaleString() || 'N/A'} km. Price: AED ${car.price?.toLocaleString() || '0'}. ${car.description || ''}`
    : 'View car details on Sello';
  const carImage = car?.images?.[0] || '/logo.png';

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={carTitle}
        description={carDescription}
        image={carImage}
        type="product"
        keywords={`${car?.make || ''} ${car?.model || ''}, ${car?.year || ''}, ${car?.condition || ''} car, ${car?.city || ''}, car for sale`}
      />
      {/* Structured Data for SEO */}
      {car && (
        <>
          <StructuredData.ProductSchema car={car} />
          <StructuredData.BreadcrumbSchema items={breadcrumbItems.map(item => ({ name: item.label, url: item.path }))} />
        </>
      )}
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Hero Section */}
      <CarDetailsHeroSection key={`hero-${id}`} />
      
      {/* Gallery Section */}
      <CarDetailsGallerySection key={`gallery-${id}`} />
      
      {/* Action Buttons */}
      <Btns />
      
      {/* Main Content */}
      <CarDetailsEtc />
      
      {/* Seller Reviews */}
      {car?.postedBy && (
        <div className="max-w-7xl mx-auto px-4 md:px-20 py-8 bg-white">
          <UserReviewSection 
            userId={car.postedBy?._id || car.postedBy} 
            carId={id}
            sellerName={car.postedBy?.name}
          />
        </div>
      )}
      
      {/* Customer Reviews */}
      <div className="bg-white">
        <CustomerReviews />
      </div>
      
      {/* Similar Listings Section */}
      {id && <SimilarListings carId={id} />}
      
      {/* Recently Viewed Section */}
      <RecentlyViewed />
      
      {/* Brands Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-12 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Explore Our Premium Brands
            </h2>
            <p className="text-gray-600 mt-2">Discover trusted automotive brands</p>
          </div>
          <Link 
            to="/view-all-brands"
            className="text-primary-500 hover:text-primary-500 font-semibold flex items-center gap-2 transition-colors"
          >
            Show All Brands
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <BrandMarquee />
      </div>
      
      {/* Ads Section */}
      <div className="bg-gray-50">
        <Ads />
      </div>
      
      {/* Blog Section */}
      <div className="bg-white">
        <BlogSection />
      </div>
    </div>
  );
};

export default CarDetails;
