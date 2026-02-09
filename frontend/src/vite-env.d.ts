/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_MAP_API_KEY: string;
  /** Google OAuth 2.0 웹 클라이언트 ID (.env에 설정 시 구글 로그인 버튼 표시) */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

declare global {
  /** Google Identity Services (GSI) - accounts.google.com/gsi/client */
  interface CredentialResponse {
    credential: string;
    select_by?: string;
    clientId?: string;
  }

  interface TokenClient {
    requestAccessToken: (options?: { prompt?: string }) => void;
  }

  interface GoogleAccounts {
    /** ID 토큰(백엔드 인증용) - initialize + renderButton 또는 prompt */
    id: {
      initialize: (config: {
        client_id: string;
        callback: (res: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options?: { theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; type?: 'standard' | 'icon'; text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'; width?: number }
      ) => void;
      prompt: (momentListener?: (notification: { isDisplayed: boolean; isNotDisplayed: boolean }) => void) => void;
    };
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope?: string;
        callback: (res: CredentialResponse) => void;
      }) => TokenClient;
    };
  }

  interface Window {
    google?: { accounts: GoogleAccounts };
    onGoogleScriptLoad?: () => void;
  }
}

export {};
