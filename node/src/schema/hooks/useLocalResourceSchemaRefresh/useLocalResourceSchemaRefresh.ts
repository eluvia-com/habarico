import {useQueryClient} from '@tanstack/react-query';

export const useLocalResourceSchemaRefresh = () => {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({queryKey: ['resourceSchema']}).then();
  };
};
