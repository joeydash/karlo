// reCAPTCHA v3 site key
const RECAPTCHA_SITE_KEY = "6LeqQQAsAAAAAImTxeR-8ZzFxbMzkrXF3vUVS8vZ";

// Declare grecaptcha on window
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

/**
 * Execute reCAPTCHA and get token
 * @param action - The action name for this reCAPTCHA execution
 * @returns Promise that resolves to the reCAPTCHA token
 */
export const getRecaptchaToken = (
  action: string = "register"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if reCAPTCHA is loaded
    if (typeof window.grecaptcha === "undefined") {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }

    // Execute reCAPTCHA
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then((token) => {
          resolve(token);
        })
        .catch((error) => {
          console.error("reCAPTCHA execution failed:", error);
          reject(error);
        });
    });
  });
};

/**
 * Wait for reCAPTCHA to be loaded with timeout
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves when reCAPTCHA is ready
 */
export const waitForRecaptcha = (timeout: number = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkRecaptcha = () => {
      if (typeof window.grecaptcha !== "undefined" && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          resolve();
        });
      } else if (Date.now() - startTime > timeout) {
        reject(new Error("reCAPTCHA loading timeout"));
      } else {
        setTimeout(checkRecaptcha, 100);
      }
    };

    checkRecaptcha();
  });
};
