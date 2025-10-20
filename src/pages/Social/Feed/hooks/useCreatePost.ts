import { useMutation, useQueryClient } from 'react-query';
import { createSocialPost, CreatePostRequest } from '@/services/social/social-feed-service';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useAuthStore } from '@/store/zustand/auth-store';
import { useProfilePostsStore, generateProfileKey } from '@/store/zustand/profile-posts-store';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export const useCreatePost = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSocialPost,
        onSuccess: async (data: any) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
                queryClient.invalidateQueries({ queryKey: ['userPosts'] });
                // Force immediate refetch of active profile lists to pick up page 0 changes
                await queryClient.refetchQueries({ queryKey: ['userPosts'] });

                // Fallback: ensure created post is present at top of Posts tab caches if BE indexing is slightly delayed
                try {
                    let created: any = data?.data?.post || data?.data || data?.post || null;
                    if (!created) {
                        const code = data?.data?.postCode || data?.data?.code || data?.postCode || data?.code;
                        const id = data?.data?.id || data?.id;
                        if (code) created = await SocialFeedService.getPostByCode(code);
                        else if (id) created = await SocialFeedService.getPostById(id);
                    }
                    if (created?.code) {
                        // 1) Update Profile store directly for immediate UI
                        try {
                            const store = useProfilePostsStore.getState();
                            const meId = useAuthStore.getState().user?.id;
                            const POSTS_TAB = 10;
                            const keys = [
                                generateProfileKey(POSTS_TAB, undefined),
                                meId != null ? generateProfileKey(POSTS_TAB, Number(meId)) : null,
                            ].filter(Boolean) as string[];
                            keys.forEach((k) => {
                                const current = store.getPosts(k);
                                const deduped = current.filter((p: any) => p?.code !== created.code);
                                store.setPosts([created, ...deduped], k);
                            });
                        } catch {}

                        // 2) Patch userPosts caches (Posts tab) in react-query
                        const matches = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                        matches.forEach(([qk, old]) => {
                            if (!old?.pages?.length || !Array.isArray(qk)) return;
                            const tabType = qk[1];
                            if (tabType !== 10) return; // Only Posts tab
                            try {
                                const firstPage = old.pages[0];
                                const list = Array.isArray(firstPage?.data?.data) ? firstPage.data.data : [];
                                const exists = list.some((p: any) => p?.code === created.code);
                                if (exists) return; // already present
                                const deduped = list.filter((p: any) => p?.code !== created.code);
                                const updatedFirst = { ...firstPage, data: { ...firstPage.data, data: [created, ...deduped] } };
                                const newData = { ...old, pages: [updatedFirst, ...old.pages.slice(1)] };
                                queryClient.setQueryData(qk as any, newData);
                            } catch {}
                        });
                    }
                } catch {}
                console.log('Post created successfully, feed will refresh');
                
            }
        },
        onError: (error: any) => {
            console.error('Failed to create post:', error);
        }
    });
};
