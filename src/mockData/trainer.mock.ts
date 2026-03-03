import type { TrainerProfile } from '@/types/trainerTypes';

export const MOCK_TRAINER_PROFILE: TrainerProfile = {
    id: '1',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    rating: 4.9,
    reviews: 142,
    yearsOfExperience: 8,
    isVerified: true,
    profileCompletion: 88,
};

export const fetchMockTrainerProfile = (): Promise<TrainerProfile> =>
    new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_TRAINER_PROFILE), 600);
    });
