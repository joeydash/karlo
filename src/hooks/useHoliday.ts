import { useEffect } from 'react';
import useHolidayStore from '../stores/holidayStore';
import { useOrganization } from './useOrganization';

export const useHoliday = () => {
  const holidayStore = useHolidayStore();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      holidayStore.fetchHolidays(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  return {
    ...holidayStore,
    fetchHolidays: holidayStore.fetchHolidays,
    createHoliday: holidayStore.createHoliday,
    updateHoliday: holidayStore.updateHoliday,
    deleteHoliday: holidayStore.deleteHoliday
  };
};