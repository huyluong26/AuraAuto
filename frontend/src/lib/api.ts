// Unified API Facade - Re-exports all modular domain APIs and utilities
export * from './api/core';

import { appointmentsApi } from './api/appointments';
import { aiApi } from './api/ai';
import { mediaApi } from './api/media';
import { authApi } from './api/auth';
import { catalogApi } from './api/catalog';
import { listingsApi } from './api/listings';
import { articlesApi } from './api/articles';
import { favoritesApi } from './api/favorites';
import { chatsApi } from './api/chats';
import { showroomsApi } from './api/showrooms';
import { paymentsApi } from './api/payments';
import { adminApi } from './api/admin';
import { notificationsApi } from './api/notifications';

export { appointmentsApi } from './api/appointments';
export { aiApi } from './api/ai';
export { mediaApi } from './api/media';
export { authApi } from './api/auth';
export { catalogApi } from './api/catalog';
export { listingsApi } from './api/listings';
export { articlesApi } from './api/articles';
export { favoritesApi } from './api/favorites';
export { chatsApi } from './api/chats';
export { showroomsApi } from './api/showrooms';
export { paymentsApi } from './api/payments';
export { adminApi } from './api/admin';
export { notificationsApi } from './api/notifications';

// Consolidated Singleton API Object (maintains 100% backward compatibility)
export const api = {
  ...appointmentsApi,
  ...aiApi,
  ...mediaApi,
  ...authApi,
  ...catalogApi,
  ...listingsApi,
  ...articlesApi,
  ...favoritesApi,
  ...chatsApi,
  ...showroomsApi,
  ...paymentsApi,
  ...adminApi,
  ...notificationsApi,
};

export default api;
