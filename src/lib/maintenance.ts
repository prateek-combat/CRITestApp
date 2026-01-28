export const isMaintenanceMode = () => process.env.MAINTENANCE_MODE === 'true';

export const maintenanceErrorPayload = {
  error: 'System under maintenance. Please try again later.',
  code: 'MAINTENANCE',
};
