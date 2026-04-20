import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to realtime changes on one or more tables and invalidate
 * the given React Query keys whenever something changes.
 */
export function useRealtimeTable(
  tables: string | string[],
  queryKeys: (string | (string | number)[])[],
  channelName?: string,
) {
  const queryClient = useQueryClient();
  const tableList = Array.isArray(tables) ? tables : [tables];
  const name = channelName ?? `rt-${tableList.join('-')}`;

  useEffect(() => {
    const channel = supabase.channel(name);

    tableList.forEach((table) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => {
          queryKeys.forEach((key) => {
            const queryKey = Array.isArray(key) ? key : [key];
            queryClient.invalidateQueries({ queryKey });
          });
        },
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}
