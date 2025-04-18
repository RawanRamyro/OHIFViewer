import { ServicesManager } from "@ohif/core";

/**
 * Sets up authentication using cookies to inject auth tokens into all OHIF requests
 * @param {Object} servicesManager - The OHIF services manager
 */
function setupCookieAuthentication(servicesManager: ServicesManager) {
  if (!servicesManager) {
    console.error('Services manager is required for authentication setup');
    return;
  }

  const userAuthenticationService = servicesManager.services.userAuthenticationService;

  if (!userAuthenticationService) {
    console.error('User authentication service not found');
    return;
  }

  // Extract auth token from cookies
  const getAuthTokenFromCookie = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
  };

  // Set up a token provider function
  const tokenProvider = () => {
    const token = getAuthTokenFromCookie();
    if (token) {
      return `Bearer ${token}`;  // Adjust format as needed for your API
    }
    return null;
  };

  // Configure the authentication service to use our token provider
  userAuthenticationService.setServiceImplementation({
    getState: () => ({}),
    setUser: () => { },
    getUser: () => ({}),
    getAuthorizationHeader: () => {
      const token = getAuthTokenFromCookie();
      return {
        Authorization: token ? `Bearer ${token}` : '',
      };
    },
    handleUnauthenticated: () => { },
    reset: () => { },
    set: () => { },
  });

  console.log('Cookie-based authentication has been configured');
}

export { setupCookieAuthentication };