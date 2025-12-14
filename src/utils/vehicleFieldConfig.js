/**
 * Central configuration for vehicle fields based on vehicle type
 * This controls which fields are visible, required, and valid for each vehicle type
 * 
 * Field visibility is controlled by the 'fields' object, where each field has:
 * - visible: boolean - whether the field should be shown in the form/filter
 * - required: boolean - whether the field is required for this vehicle type
 */

export const VEHICLE_FIELD_CONFIG = {
  Car: {
    required: [
      "title",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "fuelType",
      "engineCapacity",
      "transmission",
      "regionalSpec",
      "bodyType",
      "city",
      "contactNumber",
      "sellerType",
      "warranty",
      "ownerType",
    ],
    optional: [
      "description",
      "variant",
      "colorExterior",
      "colorInterior",
      "mileage",
      "features",
      "location",
      "carDoors",
      "horsepower",
      "numberOfCylinders",
      "geoLocation", // Made optional - will use default if not provided
    ],
    fields: {
      bodyType: { visible: true, required: true },
      cylinders: { visible: true, required: false },
      doors: { visible: true, required: false },
      horsepower: { visible: true, required: false },
      engineCapacity: { visible: true, required: true },
      batteryRange: { visible: false, required: false },
      motorPower: { visible: false, required: false },
      // Common fields
      fuelType: { visible: true, required: true },
      transmission: { visible: true, required: true },
      mileage: { visible: true, required: false },
    },
  },
  Bus: {
    required: [
      "title",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "fuelType",
      "engineCapacity",
      "transmission",
      "regionalSpec",
      "city",
      "contactNumber",
      "sellerType",
      "warranty",
      "ownerType",
    ],
    optional: [
      "description",
      "variant",
      "colorExterior",
      "colorInterior",
      "mileage",
      "features",
      "location",
      "horsepower",
      "numberOfCylinders",
      "geoLocation", // Made optional
    ],
    fields: {
      bodyType: { visible: false, required: false },
      cylinders: { visible: true, required: false },
      doors: { visible: false, required: false },
      horsepower: { visible: true, required: false },
      engineCapacity: { visible: true, required: true },
      batteryRange: { visible: false, required: false },
      motorPower: { visible: false, required: false },
      fuelType: { visible: true, required: true },
      transmission: { visible: true, required: true },
      mileage: { visible: true, required: false },
    },
  },
  Truck: {
    required: [
      "title",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "fuelType",
      "engineCapacity",
      "transmission",
      "regionalSpec",
      "city",
      "contactNumber",
      "sellerType",
      "warranty",
      "ownerType",
    ],
    optional: [
      "description",
      "variant",
      "colorExterior",
      "colorInterior",
      "mileage",
      "features",
      "location",
      "horsepower",
      "numberOfCylinders",
      "geoLocation", // Made optional
    ],
    fields: {
      bodyType: { visible: false, required: false },
      cylinders: { visible: true, required: false },
      doors: { visible: false, required: false },
      horsepower: { visible: true, required: false },
      engineCapacity: { visible: true, required: true },
      batteryRange: { visible: false, required: false },
      motorPower: { visible: false, required: false },
      fuelType: { visible: true, required: true },
      transmission: { visible: true, required: true },
      mileage: { visible: true, required: false },
    },
  },
  Van: {
    required: [
      "title",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "fuelType",
      "engineCapacity",
      "transmission",
      "regionalSpec",
      "bodyType",
      "city",
      "contactNumber",
      "sellerType",
      "warranty",
      "ownerType",
      "geoLocation",
    ],
    optional: [
      "description",
      "variant",
      "colorExterior",
      "colorInterior",
      "mileage",
      "features",
      "location",
      "carDoors",
      "horsepower",
      "numberOfCylinders",
    ],
    fields: {
      bodyType: { visible: true, required: true },
      cylinders: { visible: true, required: false },
      doors: { visible: true, required: false },
      horsepower: { visible: true, required: false },
      engineCapacity: { visible: true, required: true },
      batteryRange: { visible: false, required: false },
      motorPower: { visible: false, required: false },
      fuelType: { visible: true, required: true },
      transmission: { visible: true, required: true },
      mileage: { visible: true, required: false },
    },
  },
  Bike: {
    required: [
      "title",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "fuelType",
      "engineCapacity",
      "transmission",
      "regionalSpec",
      "city",
      "contactNumber",
      "sellerType",
      "warranty",
      "ownerType",
    ],
    optional: [
      "description",
      "variant",
      "colorExterior",
      "colorInterior",
      "mileage",
      "features",
      "location",
      "horsepower",
      "geoLocation", // Made optional
    ],
    fields: {
      bodyType: { visible: false, required: false },
      cylinders: { visible: false, required: false },
      doors: { visible: false, required: false },
      horsepower: { visible: true, required: false },
      engineCapacity: { visible: true, required: true },
      batteryRange: { visible: false, required: false },
      motorPower: { visible: false, required: false },
      fuelType: { visible: true, required: true },
      transmission: { visible: true, required: true },
      mileage: { visible: true, required: false },
    },
  },
  "E-bike": {
    required: [
      "title",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "fuelType",
      "transmission",
      "regionalSpec",
      "city",
      "contactNumber",
      "sellerType",
      "warranty",
      "ownerType",
    ],
    optional: [
      "description",
      "variant",
      "colorExterior",
      "colorInterior",
      "mileage",
      "features",
      "location",
      "batteryRange",
      "motorPower",
      "geoLocation", // Made optional
    ],
    fields: {
      bodyType: { visible: false, required: false },
      cylinders: { visible: false, required: false },
      doors: { visible: false, required: false },
      horsepower: { visible: false, required: false },
      engineCapacity: { visible: false, required: false },
      batteryRange: { visible: true, required: false },
      motorPower: { visible: true, required: false },
      fuelType: { visible: true, required: true },
      transmission: { visible: true, required: true },
      mileage: { visible: true, required: false },
    },
  },
};

/**
 * Get required fields for a vehicle type
 */
export const getRequiredFields = (vehicleType) => {
  return VEHICLE_FIELD_CONFIG[vehicleType]?.required || VEHICLE_FIELD_CONFIG.Car.required;
};

/**
 * Get optional fields for a vehicle type
 */
export const getOptionalFields = (vehicleType) => {
  return VEHICLE_FIELD_CONFIG[vehicleType]?.optional || VEHICLE_FIELD_CONFIG.Car.optional;
};

/**
 * Check if a field is visible for a vehicle type
 */
export const isFieldVisible = (vehicleType, fieldName) => {
  return VEHICLE_FIELD_CONFIG[vehicleType]?.fields?.[fieldName]?.visible ?? true;
};

/**
 * Check if a field is required for a vehicle type
 */
export const isFieldRequired = (vehicleType, fieldName) => {
  const config = VEHICLE_FIELD_CONFIG[vehicleType];
  if (!config) return false;
  
  // Check in required array
  if (config.required?.includes(fieldName)) return true;
  
  // Check in fields object
  if (config.fields?.[fieldName]?.required) return true;
  
  return false;
};

/**
 * Get all visible fields for a vehicle type
 */
export const getVisibleFields = (vehicleType) => {
  const config = VEHICLE_FIELD_CONFIG[vehicleType] || VEHICLE_FIELD_CONFIG.Car;
  const visibleFields = {};
  
  Object.keys(config.fields || {}).forEach(field => {
    if (config.fields[field].visible) {
      visibleFields[field] = config.fields[field];
    }
  });
  
  return visibleFields;
};

/**
 * Get field label for display
 */
export const getFieldLabel = (fieldName) => {
  const labels = {
    bodyType: "Body Type",
    cylinders: "Number of Cylinders",
    doors: "Car Doors",
    horsepower: "Horsepower",
    engineCapacity: "Engine Capacity (cc)",
    batteryRange: "Battery Range (km)",
    motorPower: "Motor Power (W)",
    fuelType: "Fuel Type",
    transmission: "Transmission",
    mileage: "Mileage (km)",
  };
  return labels[fieldName] || fieldName;
};
