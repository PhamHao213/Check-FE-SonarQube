// Cookie utility functions for token management

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const setCookie = (name, value, options = {}) => {
  const {
    expires,
    maxAge,
    domain,
    path = '/',
    secure = false,
    httpOnly = false,
    sameSite = 'Strict'
  } = options;

  let cookieString = `${name}=${value}; path=${path}`;
  
  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  
  if (maxAge) {
    cookieString += `; max-age=${maxAge}`;
  }
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  if (secure) {
    cookieString += `; secure`;
  }
  
  if (httpOnly) {
    cookieString += `; httponly`;
  }
  
  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }

  document.cookie = cookieString;
};

export const deleteCookie = (name, path = '/') => {
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// Token specific functions
export const getAccessToken = () => {
  return getCookie('accessToken');
};

export const getRefreshToken = () => {
  return getCookie('refreshToken');
};

export const setTokens = (accessToken, refreshToken) => {
  // Set access token with shorter expiry (15 minutes)
  setCookie('accessToken', accessToken, {
    maxAge: 30 * 60, // 15 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
  
  // Set refresh token with longer expiry (7 days)
  setCookie('refreshToken', refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
};

export const clearTokens = () => {
  deleteCookie('accessToken');
  deleteCookie('refreshToken');
};