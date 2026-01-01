import React, { useMemo } from "react";
import SpecsUtility from "./SpecsUtility";
import { fuelType } from "../../../assets/images/carDetails/types/bodyTypes";

const FuelSpecs = ({ onChange, vehicleType, value }) => {
  const handleSelect = (titleValue) => {
    if (onChange) {
      onChange(titleValue);
    }
  };

  // Filter fuel types based on vehicle type
  const filteredFuelTypes = useMemo(() => {
    // For Bus, Truck, Van - only show Diesel and Petrol
    if (
      vehicleType === "Bus" ||
      vehicleType === "Truck" ||
      vehicleType === "Van"
    ) {
      return fuelType.filter(
        (fuel) => fuel.titleValue === "Diesel" || fuel.titleValue === "Petrol"
      );
    }
    // For Car and others - show all options
    return fuelType;
  }, [vehicleType]);

  return (
    <div>
      <SpecsUtility
        groupName={"fuelType"}
        specsTypes={filteredFuelTypes}
        value={value}
        onChange={handleSelect}
      />
    </div>
  );
};

export default FuelSpecs;
