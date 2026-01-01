import React from "react";
import { getBodyTypesByVehicleType } from "../../../assets/images/carDetails/types/bodyTypes";
import SpecsUtility from "./SpecsUtility";

const BodyTypes = ({ onChange, vehicleType = "Car", value }) => {
  const handleSelect = (titleValue) => {
    if (onChange) {
      onChange(titleValue); // Send to parent
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
        value={value}
        onChange={handleSelect}
      />
    </>
  );
};

export default BodyTypes;
