import React from 'react';
import { MessageCircle, Send } from 'lucide-react';
import {
  WhatsAppInquiryOptions,
  openWhatsAppInquiry,
  getWhatsAppInquiryUrl,
} from '../../utils/whatsapp';

interface WhatsAppInquiryButtonProps {
  options: WhatsAppInquiryOptions;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle' | 'floating';
  label?: string;
  showIcon?: boolean;
  className?: string;
  stopPropagation?: boolean;
}

export const WhatsAppInquiryButton: React.FC<WhatsAppInquiryButtonProps> = ({
  options,
  size = 'sm',
  variant = 'solid',
  label = 'WhatsApp Inquiry',
  showIcon = true,
  className = '',
  stopPropagation = true,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    openWhatsAppInquiry(options);
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  }[size];

  const variantClasses = {
    solid:
      'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs hover:shadow-md hover:shadow-emerald-500/20 font-bold border border-emerald-600/30',
    outline:
      'border border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 font-semibold bg-white',
    subtle:
      'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 font-semibold',
    floating:
      'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-emerald-600/30 font-bold rounded-full border border-emerald-400/30',
  }[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Inquire directly via WhatsApp (0750928078)"
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${sizeClasses} ${variantClasses} ${className}`}
    >
      {showIcon && <MessageCircle className="w-4 h-4 shrink-0 fill-current/10" />}
      {label && <span className="truncate">{label}</span>}
    </button>
  );
};
