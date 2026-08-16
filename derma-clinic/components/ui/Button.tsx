import { cn } from "@/lib/cn";

/**
 * Button — single primary CTA per screen, with clear visual hierarchy.
 *
 * Variants:
 *  - `primary`: sage filled — the single dominant action (e.g. 예약하기)
 *  - `secondary`: outlined — secondary, subordinate action
 *  - `ghost`: text — inline / nav use
 *
 * Renders `<a>` when `href` is provided (client-side nav), `<button>` otherwise.
 * Touch target ≥ 44px ensured via py-3.5 (14px top+bottom + line-height =
 * ~44px). Icon-only buttons are disallowed — always pair with a label.
 *
 * @example <Button variant="primary" href="#reservation">예약하기</Button>
 */
type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  ariaLabel?: string;
};

type ButtonProps = ButtonAsLink | ButtonAsButton;

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const sizeClass: Record<Size, string> = {
  md: "",
  lg: "text-body px-8 py-4",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    icon,
    iconPosition = "right",
  } = props;

  const classes = cn(variantClass[variant], sizeClass[size], className);
  const iconNode = icon ? (
    <span className={cn("shrink-0", iconPosition === "left" && "order-first")}>
      {icon}
    </span>
  ) : null;

  if ("href" in props && props.href) {
    const { href, external, onClick } = props;
    const isExternal = external ?? /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        onClick={onClick}
        className={classes}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {iconPosition === "left" && iconNode}
        <span>{children}</span>
        {iconPosition === "right" && iconNode}
      </a>
    );
  }

  const { type = "button", onClick, disabled, ariaLabel } =
    props as ButtonAsButton;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
    >
      {iconPosition === "left" && iconNode}
      <span>{children}</span>
      {iconPosition === "right" && iconNode}
    </button>
  );
}
