import useSchedule from '@/hooks/useSchedule';

const useIsScheduleEnabled = () => {
  const { schedule } = useSchedule();

  return Boolean(schedule?.enabled);
};

export default useIsScheduleEnabled;
