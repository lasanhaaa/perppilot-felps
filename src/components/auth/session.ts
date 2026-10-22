/** Sign up answers kept between the auth screens until a real API exists. */
const EMAIL_KEY = "perppilot.signup-email";

export function saveSignupEmail(email: string) {
  try {
    window.sessionStorage.setItem(EMAIL_KEY, email);
  } catch {
    // storage can be blocked; the verify screen falls back to a placeholder
  }
}

export function readSignupEmail() {
  try {
    return window.sessionStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

/** Mock network delay so buttons show their pending state. */
export const fakeRequest = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));
