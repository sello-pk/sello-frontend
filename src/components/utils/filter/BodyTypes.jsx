import React from "react";
import { getBodyTypesByVehicleType } from "../../../assets/images/carDetails/types/bodyTypes";
import SpecsUtility from "./SpecsUtility";

const BodyTypes = ({ onBodyTypeChange, vehicleType = "Car" }) => {
  const handleSelect = (titleValue) => {
    if (onBodyTypeChange) {
      onBodyTypeChange(titleValue); // Send to parent
    }
  };
  
  // Get body types filtered by vehicle type
  const bodyTypes = getBodyTypesByVehicleType(vehicleType);
  
  // Don't render if no body types for this vehicle type
  if (!bodyTypes || bodyTypes.length === 0) {
    return null;
  }
  
  return (
    <>
      <SpecsUtility
        groupName={"bodyTypes"}
        specsTypes={bodyTypes}
        onChange={handleSelect}
      />
    </>
  );
};

export default BodyTypes;
