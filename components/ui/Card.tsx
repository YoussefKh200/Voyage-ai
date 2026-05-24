// components/ui/Card.tsx
// ─── Reusable Card component with glass variants ──────────────────────────────

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gold?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, gold, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass rounded-2xl border border-white/10",
        hover && "card-hover cursor-pointer",
        gold && "border-[#d4a853]/20 bg-[#d4a853]/5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-5 border-b border-white/8", className)}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
};

Card.Footer = function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-t border-white/8", className)}>
      {children}
    </div>
  );
};
