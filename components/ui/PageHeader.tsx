type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function PageHeader({ eyebrow, title, subtitle, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {eyebrow ? (
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="m-0 font-fredoka text-[30px] font-semibold leading-tight text-text">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-[5px] text-[14.5px] text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
