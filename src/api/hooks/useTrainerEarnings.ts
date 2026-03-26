import { trainerService } from '@/api/services/trainer.service';
import type { TrainerEarningsResponse } from '@/types/trainerTypes';

import { useApiQuery } from './useApiQuery';

export function useTrainerEarnings() {
    return useApiQuery<TrainerEarningsResponse>(
        'trainer-earnings',
        () => trainerService.getEarnings(),
        { refetchOnMount: true },
    );
}
