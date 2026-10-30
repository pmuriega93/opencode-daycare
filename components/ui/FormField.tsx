type FormFieldProps = {
  label: string;
  type?: "text" | "email" | "password";
  defaultValue?: string;
  placeholder?: string;
  inputClassName?: string;
};

export function FormField({
  label,
  type = "text",
  defaultValue,
  placeholder,
  inputClassName = "",
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted">
        {label}
      </span>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full rounded-[14px] border-[1.5px] border-line-input bg-white px-4 py-[14px] text-[15px] text-text outline-none placeholder:text-[#B6A99B] ${inputClassName}`}
      />
    </label>
  );
}
