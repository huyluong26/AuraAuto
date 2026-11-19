import { adminMetricsApi } from './admin/adminMetrics';
import { adminAppointmentsApi } from './admin/adminAppointments';
import { adminListingsApi } from './admin/adminListings';
import { adminUsersShowroomsApi } from './admin/adminUsersShowrooms';
import { adminPromotionsApi } from './admin/adminPromotions';
import { adminReportsOpsApi } from './admin/adminReportsOps';

export const adminApi = {
  ...adminMetricsApi,
  ...adminAppointmentsApi,
  ...adminListingsApi,
  ...adminUsersShowroomsApi,
  ...adminPromotionsApi,
  ...adminReportsOpsApi,
};

export {
  adminMetricsApi,
  adminAppointmentsApi,
  adminListingsApi,
  adminUsersShowroomsApi,
  adminPromotionsApi,
  adminReportsOpsApi,
};
