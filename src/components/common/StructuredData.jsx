/**
 * Structured Data (JSON-LD) Component
 * Adds structured data for SEO and rich snippets
 */

import { useEffect } from 'react';

/**
 * Add structured data script to document head
 */
const addStructuredData = (data) => {
    // Remove existing script if any
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
        existingScript.remove();
    }

    // Create new script
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
};

/**
 * Product Schema for Car Listing
 */
export const ProductSchema = ({ car }) => {
    useEffect(() => {
        if (!car) return;

        const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
        const carUrl = `${baseUrl}/cars/${car._id}`;
        const imageUrl = car.images?.[0] || `${baseUrl}/logo.png`;

        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": `${car.make} ${car.model} ${car.year}`,
            "description": car.description || `${car.make} ${car.model} ${car.year} ${car.condition} car for sale in ${car.city}`,
            "image": car.images || [imageUrl],
            "brand": {
                "@type": "Brand",
                "name": car.make
            },
            "offers": {
                "@type": "Offer",
                "url": carUrl,
                "priceCurrency": "PKR",
                "price": car.price,
                "priceValidUntil": car.expiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                "availability": car.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
                "seller": {
                    "@type": car.sellerType === 'dealer' ? "AutoDealer" : "Person",
                    "name": car.postedBy?.name || "Seller"
                }
            },
            "vehicleIdentificationNumber": car._id.toString(),
            "model": car.model,
            "productionDate": `${car.year}-01-01`,
            "vehicleConfiguration": {
                "@type": "VehicleConfiguration",
                "fuelType": car.fuelType,
                "transmission": car.transmission,
                "bodyType": car.bodyType || "Car"
            },
            "mileageFromOdometer": {
                "@type": "QuantitativeValue",
                "value": car.mileage || 0,
                "unitCode": "KMT"
            }
        };

        addStructuredData(schema);
    }, [car]);

    return null;
};

/**
 * Organization Schema
 */
export const OrganizationSchema = () => {
    useEffect(() => {
        const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
        const siteName = 'Sello';
        const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com';

        const schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": siteName,
            "url": baseUrl,
            "logo": `${baseUrl}/logo.png`,
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Service",
                "email": supportEmail
            },
            "sameAs": [
                // Add social media links if available
            ]
        };

        addStructuredData(schema);
    }, []);

    return null;
};

/**
 * BreadcrumbList Schema
 */
export const BreadcrumbSchema = ({ items }) => {
    useEffect(() => {
        if (!items || items.length === 0) return;

        const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url ? (item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`) : baseUrl
            }))
        };

        addStructuredData(schema);
    }, [items]);

    return null;
};

/**
 * WebSite Schema with SearchAction
 */
export const WebSiteSchema = () => {
    useEffect(() => {
        const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

        const schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Sello",
            "url": baseUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${baseUrl}/search-results?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };

        addStructuredData(schema);
    }, []);

    return null;
};

export default {
    ProductSchema,
    OrganizationSchema,
    BreadcrumbSchema,
    WebSiteSchema
};

