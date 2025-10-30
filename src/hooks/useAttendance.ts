import { useEffect } from 'react';
import useAttendanceStore from '../stores/attendanceStore';
import { useMember } from './useMember';

export const useAttendance = () => {
  const attendanceStore = useAttendanceStore();

  return attendanceStore;
};