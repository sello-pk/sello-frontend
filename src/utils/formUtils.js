/**
 * Maps backend field types to frontend input types and props
 * @param {Object} field - The field configuration from backend
 * @returns {Object} - Props for the input component
 */
export const mapFieldToInputProps = (field) => {
  const commonProps = {
    name: field.name,
    label: field.label,
    required: field.required,
    placeholder: field.placeholder || `Enter ${field.label}`,
    // If validation rules exist
    min: field.validationRules?.min,
    max: field.validationRules?.max,
    pattern: field.validationRules?.regex,
  };

  switch (field.type) {
    case 'text':
      return {
        ...commonProps,
        type: 'text',
      };
    case 'number':
      return {
        ...commonProps,
        type: 'number',
        min: field.validationRules?.min !== undefined ? field.validationRules.min : 0,
      };
    case 'textarea':
      return {
        ...commonProps,
        type: 'textarea',
        rows: 4,
      };
    case 'select':
      return {
        ...commonProps,
        type: 'select',
        options: field.options || [],
      };
    case 'multiselect':
        return {
            ...commonProps,
            type: 'multiselect', 
            options: field.options || [],
        };
    case 'checkbox':
        return {
            ...commonProps,
            type: 'checkbox',
        };
    case 'date':
        return {
            ...commonProps,
            type: 'date',
        };
    case 'radio':
        return {
            ...commonProps,
            type: 'radio',
            options: field.options || []
        };
    default:
      return {
        ...commonProps,
        type: 'text',
      };
  }
};
