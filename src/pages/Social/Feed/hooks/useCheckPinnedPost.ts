import { useQuery } from 'react-query';
import { useAuthStore } from '@/store/zustand/auth-store';

export const useCheckPinnedPost = () => {
    const { user } = useAuthStore();

    return useQuery(
        ['checkPinnedPost', user?.id],
        async () => {
            // Check in userPosts cache for any pinned post
            // This is a simple check, you can also call API if needed
            return null; // Will be checked via cache
        },
        {
            enabled: false, // We'll manually check the cache
            staleTime: 0,
        }
    );
};
