import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, MessageCircle, X } from 'lucide-react';
import { MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import { useAuth } from '../../context/AuthContext';

const WELCOME_SHOWN_KEY = 'mahdev:whatsapp-welcome-shown';

const WhatsAppMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .1 5.4.1 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6a12 12 0 0 0 5.8 1.5h.1c6.6 0 12-5.4 12-12a11.8 11.8 0 0 0-3.7-8.4ZM12.1 22a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.3-.4A9.9 9.9 0 1 1 12.1 22Zm5.5-7.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.4Z" />
  </svg>
);

function wasWelcomeShown(): boolean {
  try {
    return sessionStorage.getItem(WELCOME_SHOWN_KEY) === '1';
  } catch (error) {
    console.warn('[WhatsAppWidget] Could not read session state:', error);
    return false;
  }
}

function markWelcomeShown(): void {
  try {
    sessionStorage.setItem(WELCOME_SHOWN_KEY, '1');
  } catch (error) {
    console.warn('[WhatsAppWidget] Could not save session state:', error);
  }
}

export const WhatsAppWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (wasWelcomeShown()) return;
    const timer = window.setTimeout(() => {
      markWelcomeShown();
      setIsOpen(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const openChat = () => {
    const name = user?.fullName?.trim().split(/\s+/)[0];
    setMessage(name
      ? `Hi, I'm ${name}. I would like to know more about your services.`
      : 'Hi MAHDEV, I would like to know more about your services.');
    markWelcomeShown();
    setIsOpen(true);
  };

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    const url = `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(cleanMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="whatsapp-widget fixed bottom-24 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-label="MAHDEV WhatsApp support"
          className="whatsapp-panel w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem]"
        >
          <div className="whatsapp-panel-header">
            <div className="whatsapp-panel-avatar">
              <WhatsAppMark className="h-6 w-6 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold tracking-wide">MAHDEV Support</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/75">
                <span className="whatsapp-online-dot" /> Here to help you
              </p>
            </div>
            <span className="whatsapp-secure-tag"><Check className="h-3 w-3" /> WhatsApp</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat invitation"
              className="whatsapp-close-button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="whatsapp-panel-body">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Start a conversation</p>
            <div className="whatsapp-message-bubble">
              <p className="text-sm leading-6 text-slate-800">
                {user?.fullName?.trim()
                  ? `Hi ${user.fullName.trim().split(/\s+/)[0]}! How can we help you today?`
                  : 'Hi! How can we help you today?'}
              </p>
              <span className="whatsapp-message-time">Now</span>
            </div>
            <p className="text-xs leading-5 text-slate-500">Send us a message and we’ll continue with you on WhatsApp.</p>
            <form onSubmit={sendMessage} className="whatsapp-message-form">
              <label className="sr-only" htmlFor="mahdev-whatsapp-message">Your WhatsApp message</label>
              <input
                id="mahdev-whatsapp-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                placeholder="Write your message..."
                className="whatsapp-message-input"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                aria-label="Continue to WhatsApp"
                className="whatsapp-send-button"
              >
                <WhatsAppMark className="h-4 w-4 shrink-0 fill-current" />
                <span>Continue</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </button>
            </form>
            <p className="whatsapp-panel-footnote">Opens WhatsApp in a new tab</p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        aria-label={isOpen ? 'Close WhatsApp support' : 'Open WhatsApp support'}
        aria-expanded={isOpen}
        className="whatsapp-launcher flex h-14 w-14 items-center justify-center rounded-full text-white transition duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" strokeWidth={2.25} />}
      </button>
    </div>
  );
};
