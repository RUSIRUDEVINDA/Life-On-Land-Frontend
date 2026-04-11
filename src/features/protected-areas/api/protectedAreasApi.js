import { protectedAreaService } from '../../../services/protectedAreaService';

export const protectedAreasApi = {
  getProtectedAreas: (...args) => protectedAreaService.getProtectedAreas(...args),
  getProtectedAreaById: (...args) => protectedAreaService.getProtectedAreaById(...args),
  createProtectedArea: (...args) => protectedAreaService.createProtectedArea(...args),
  updateProtectedArea: (...args) => protectedAreaService.updateProtectedArea(...args),
  deleteProtectedArea: (...args) => protectedAreaService.deleteProtectedArea(...args),
  getZonesByProtectedAreaId: (...args) => protectedAreaService.getZonesByProtectedAreaId(...args),
  createZone: (...args) => protectedAreaService.createZone(...args),
  updateZone: (...args) => protectedAreaService.updateZone(...args),
  deleteZone: (...args) => protectedAreaService.deleteZone(...args),
};
