'use client';

import { useState, useCallback } from 'react';
import { CommitmentsState, VehicleHistoryState } from '../types';

export function useListingTechnicalHistory() {
  const [commitments, setCommitments] = useState<CommitmentsState>({
    isOwner: false,
    maintenanceHistory: false,
    noAccidentFlood: false,
    readyInspection: false,
  });

  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistoryState>({
    accidentStatus: 'UNKNOWN',
    floodStatus: 'UNKNOWN',
    serviceHistory: 'UNKNOWN',
    ownerCount: 0,
    repaintedPartsCount: 0,
    replacedParts: '',
    engineRepaired: false,
    transmissionRepaired: false,
  });

  const toggleCommitment = useCallback((key: keyof CommitmentsState) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateVehicleHistory = useCallback((patch: Partial<VehicleHistoryState>) => {
    setVehicleHistory((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    commitments,
    setCommitments,
    toggleCommitment,
    vehicleHistory,
    setVehicleHistory,
    updateVehicleHistory,
  };
}
