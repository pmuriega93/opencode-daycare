import { useId, type ChangeEvent } from "react";
import { IconChevronDown } from "@/components/ui/Icons";

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  error?: string;
  className?: string;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  className = "",
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <label htmlFor={id} className={`block ${className}`}>
      <span className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted">
        {label}
      </span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full appearance-none rounded-[14px] border-[1.5px] bg-white py-[14px] pl-4 pr-[42px] text-[15px] leading-[1.5] outline-none ${
            value ? "font-bold text-text" : "text-[#B6A99B]"
          } ${error ? "border-accent" : "border-line-input"}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <IconChevronDown
          size={16}
          strokeWidth={2.2}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A290]"
        />
      </div>
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
