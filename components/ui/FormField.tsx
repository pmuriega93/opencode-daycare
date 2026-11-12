import { useId, type ChangeEvent } from "react";

type FormFieldProps = {
  label: string;
  name?: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  textarea?: boolean;
  rows?: number;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  value,
  onChange,
  placeholder,
  error,
  textarea = false,
  rows = 4,
  autoFocus = false,
  className = "",
  inputClassName = "",
  labelClassName = "",
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange?.(event.target.value);
  };

  const fieldClass = `w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-text outline-none placeholder:text-[#B6A99B] ${
    error ? "border-accent" : "border-line-input"
  } ${inputClassName}`;

  const shared = {
    id,
    name,
    autoComplete,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    "data-autofocus": autoFocus ? "" : undefined,
    value,
    defaultValue: value === undefined ? defaultValue : undefined,
    onChange: onChange ? handleChange : undefined,
  };

  return (
    <label htmlFor={id} className={`block ${className}`}>
      <span
        className={`mb-2 block text-[12px] tracking-[0.7px] text-muted ${
          labelClassName || "font-bold"
        }`}
      >
        {label}
      </span>
      {textarea ? (
        <textarea
          {...shared}
          rows={rows}
          className={`${fieldClass} min-h-[90px] resize-y leading-[1.5]`}
        />
      ) : (
        <input {...shared} type={type} className={fieldClass} />
      )}
      {error && (
        <span
          id={errorId}
          className="mt-1.5 block text-[12.5px] font-bold text-accent"
        >
          {error}
        </span>
      )}
    </label>
  );
}
