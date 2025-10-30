import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: string | HTMLElement, parameters: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export function useRecaptcha() {
  const [isReady, setIsReady] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    const checkRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          setIsReady(true);
        });
      } else {
        setTimeout(checkRecaptcha, 100);
      }
    };

    checkRecaptcha();
  }, []);

  const executeRecaptcha = async (): Promise<string | null> => {
    if (!isReady || !siteKey) {
      console.error('reCAPTCHA not ready or site key not configured');
      return null;
    }

    return new Promise((resolve) => {
      const container = document.createElement('div');
      container.className = 'g-recaptcha';
      document.body.appendChild(container);

      try {
        window.grecaptcha.render(container, {
          sitekey: siteKey,
          callback: (token: string) => {
            document.body.removeChild(container);
            resolve(token);
          },
          'expired-callback': () => {
            document.body.removeChild(container);
            resolve(null);
          },
          'error-callback': () => {
            document.body.removeChild(container);
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Error rendering reCAPTCHA:', error);
        document.body.removeChild(container);
        resolve(null);
      }
    });
  };

  return { isReady, executeRecaptcha };
}
