import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStatesProps {
  loading: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
  refreshing: boolean;
  hasNextPage: boolean;
  posts: any[];
  error: any;
  onRefresh: () => void;
  onFetchNextPage: () => void;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({
  loading,
  isFetchingNextPage,
  isRefetching,
  refreshing,
  hasNextPage,
  posts,
  error,
  onRefresh,
  onFetchNextPage
}) => {
  const { t } = useTranslation();

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('Error loading posts')}</h3>
          <p className="text-gray-500 mb-4">{typeof error === 'string' ? error : 'An error occurred'}</p>
          <button
            onClick={onRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('Try again')}
          </button>
        </div>
      </div>
    );
  }

  // Initial loading/refreshing skeleton when no posts yet
  if ((loading || isRefetching || refreshing) && posts.length === 0) {
    return (
      <div className="px-4 py-4 space-y-5">
        {[0,1,2].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-2xl" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
            <div className="px-4 pb-4 flex items-center gap-6">
              <div className="h-3 w-8 bg-gray-200 rounded" />
              <div className="h-3 w-8 bg-gray-200 rounded" />
              <div className="h-3 w-8 bg-gray-200 rounded" />
              <div className="h-3 w-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Refreshing indicator removed to prevent duplication with page-level overlay */}

      {/* Loading more posts indicator */}
      {isFetchingNextPage && posts.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('Loading more posts...')}</span>
          </div>
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && !loading && !isFetchingNextPage && posts.length > 0 && (
        <div className="flex justify-center py-6">
          <button
            onClick={onFetchNextPage}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('Load more posts')}
          </button>
        </div>
      )}

      {/* No more posts indicator */}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">{t('No more posts to load')}</p>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !loading && !error && !isRefetching && !refreshing && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No posts yet')}</h3>
            <p className="text-gray-500 mb-4">{t('Be the first to share something!')}</p>
          </div>
        </div>
      )}
    </>
  );
};
