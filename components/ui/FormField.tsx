"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

interface BaseFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  as?: "input";
}

interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: "textarea";
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  as: "select";
  children: ReactNode;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

// ============================================================================
// Styles
// ============================================================================

const baseInputStyles = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 transition-colors";
const normalStyles = "border-gray-300 focus:ring-primary-500 focus:border-primary-500";
const errorStyles = "border-red-300 focus:ring-red-500 focus:border-red-500";
const disabledStyles = "bg-gray-50 text-gray-500 cursor-not-allowed";

// ============================================================================
// FormField Component
// ============================================================================

export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>((props, ref) => {
  const { label, error, hint, required, className = "", ...rest } = props;
  const as = "as" in props ? props.as : "input";

  const inputClassName = `${baseInputStyles} ${error ? errorStyles : normalStyles} ${
    rest.disabled ? disabledStyles : ""
  } ${className}`;

  const renderField = () => {
    if (as === "textarea") {
      const { as: _, ...textareaProps } = rest as TextareaFieldProps;
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={inputClassName}
          rows={textareaProps.rows || 3}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaProps.id}-error` : undefined}
          {...textareaProps}
        />
      );
    }

    if (as === "select") {
      const { as: _, children, ...selectProps } = rest as SelectFieldProps;
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          className={inputClassName}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectProps.id}-error` : undefined}
          {...selectProps}
        >
          {children}
        </select>
      );
    }

    const { as: _, ...inputProps } = rest as InputFieldProps;
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        className={inputClassName}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputProps.id}-error` : undefined}
        {...inputProps}
      />
    );
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderField()}
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = "FormField";

// ============================================================================
// Convenience Components
// ============================================================================

export const TextField = forwardRef<HTMLInputElement, Omit<InputFieldProps, "as">>((props, ref) => (
  <FormField ref={ref} as="input" type="text" {...props} />
));
TextField.displayName = "TextField";

export const EmailField = forwardRef<HTMLInputElement, Omit<InputFieldProps, "as" | "type">>((props, ref) => (
  <FormField ref={ref} as="input" type="email" {...props} />
));
EmailField.displayName = "EmailField";

export const PasswordField = forwardRef<HTMLInputElement, Omit<InputFieldProps, "as" | "type">>((props, ref) => (
  <FormField ref={ref} as="input" type="password" {...props} />
));
PasswordField.displayName = "PasswordField";

export const NumberField = forwardRef<HTMLInputElement, Omit<InputFieldProps, "as" | "type">>((props, ref) => (
  <FormField ref={ref} as="input" type="number" {...props} />
));
NumberField.displayName = "NumberField";

export const PhoneField = forwardRef<HTMLInputElement, Omit<InputFieldProps, "as" | "type">>((props, ref) => (
  <FormField ref={ref} as="input" type="tel" {...props} />
));
PhoneField.displayName = "PhoneField";

export const TextareaField = forwardRef<HTMLTextAreaElement, Omit<TextareaFieldProps, "as">>((props, ref) => (
  <FormField ref={ref} as="textarea" {...props} />
));
TextareaField.displayName = "TextareaField";

export const SelectField = forwardRef<HTMLSelectElement, Omit<SelectFieldProps, "as">>((props, ref) => (
  <FormField ref={ref} as="select" {...props} />
));
SelectField.displayName = "SelectField";

export default FormField;
