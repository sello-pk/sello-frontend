import React, { useMemo } from 'react';
import { useGetVehicleFieldsQuery } from '../../../redux/services/api';
import Input from '../../utils/filter/Input';
import { mapFieldToInputProps } from '../../../utils/formUtils';

const DynamicFormRenderer = ({ vehicleTypeId, formData, onChange, customRenderers = {} }) => {
    // Skip query if no vehicle type selected
    const { data: fields, isLoading, error } = useGetVehicleFieldsQuery(vehicleTypeId, {
        skip: !vehicleTypeId
    });

    if (!vehicleTypeId) return null;
    if (isLoading) return <div className="p-4 text-center">Loading form fields...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading fields.</div>;
    if (!fields || fields.length === 0) return <div className="p-4 text-center">No fields configured for this vehicle type.</div>;

    return (
        <div className="space-y-4">
            {fields.map(field => {
                // Check for custom renderer first
                if (customRenderers[field.name]) {
                    return (
                        <div key={field._id} className="mb-2">
                             {customRenderers[field.name](field, formData[field.name], (val) => onChange(field.name, val))}
                        </div>
                    );
                }

                const props = mapFieldToInputProps(field);
                const value = formData[field.name] !== undefined ? formData[field.name] : '';

                const handleChange = (e) => {
                    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    onChange(field.name, val);
                };

                // Render based on mapped type
                switch (props.type) {
                    case 'select':
                        return (
                            <div key={field._id} className="mb-2">
                                <label className="block mb-1 decoration-gray-900 font-medium">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <select
                                    name={field.name}
                                    value={value}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                    required={field.required}
                                >
                                    <option value="">Select {field.label}</option>
                                    {props.options.map((opt, idx) => (
                                        <option key={idx} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        );
                    
                    case 'textarea':
                         return (
                            <div key={field._id} className="mb-2">
                                <label className="block mb-1 font-medium">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    name={field.name}
                                    value={value}
                                    onChange={handleChange}
                                    placeholder={props.placeholder}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows={props.rows}
                                    required={field.required}
                                />
                            </div>
                        );
                    
                    case 'checkbox':
                        return (
                             <div key={field._id} className="mb-2 flex items-center">
                                <input
                                    type="checkbox"
                                    name={field.name}
                                    checked={Boolean(value)}
                                    onChange={handleChange}
                                    className="mr-2 h-4 w-4"
                                />
                                <label className="font-medium">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                            </div>
                        );

                    default: // Text, Number, Date, etc.
                        return (
                            <div key={field._id} className="mb-2">
                                <label className="block mb-1 font-medium">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <Input
                                    inputType={props.type}
                                    value={value}
                                    onChange={handleChange}
                                    placeholder={props.placeholder}
                                />
                            </div>
                        );
                }
            })}
        </div>
    );
};

export default DynamicFormRenderer;
