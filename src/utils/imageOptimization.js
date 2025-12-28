// Image optimization utilities
export const optimizeImage = (src, options = {}) => {
  const { width, height, quality = 80, format = "auto" } = options;

  // If using Cloudinary, apply transformations
  if (src.includes("cloudinary")) {
    const transformations = [];
    if (width || height)
      transformations.push(
        `c_limit,w_${width || "auto"},h_${height || "auto"}`
      );
    if (quality !== 100) transformations.push(`q_${quality}`);
    if (format !== "auto") transformations.push(`f_${format}`);

    const baseUrl = src.split("/upload/")[0] + "/upload/";
    const publicId = src.split("/upload/")[1]?.split(".")[0] || "";
    const extension = src.split(".").pop();

    return transformations.length > 0
      ? `${baseUrl}${transformations.join(",")}/${publicId}.${extension}`
      : src;
  }

  return src;
};

export const generateResponsiveSrcSet = (
  src,
  sizes = [640, 768, 1024, 1280]
) => {
  return sizes
    .map((size) => `${optimizeImage(src, { width: size })} ${size}w`)
    .join(", ");
};

export const preloadCriticalImages = (imageUrls) => {
  imageUrls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  });
};
