import { useEffect, useRef } from "react";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { Capacitor } from "@capacitor/core";
import { useHistory } from "react-router";
import { useInfiniteQuery } from "react-query";
import { getUserChatRooms } from "@/services/social/social-chat-service";

const PAGE_SIZE = 20;

const SocialChatSearch = () => {
  const { search, clearSearch } = useSocialChatStore();
  console.log(search)
  const history = useHistory();
  const isNative = Capacitor.isNativePlatform();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(
    ["chatRooms", search],
    ({ pageParam = 0 }) => getUserChatRooms({ PageNumber: pageParam, PageSize: PAGE_SIZE, Keyword: search }),
    {
      getNextPageParam: (lastPage, pages) => {
        const totalLoaded = pages.flat().length;
        if (lastPage.length < PAGE_SIZE) return undefined;
        return Math.floor(totalLoaded / PAGE_SIZE);
      },
    }
  );

  const allUsers = data?.pages.flat() || [];

  const handleScroll = () => {
    const div = scrollRef.current;
    if (div && div.scrollTop + div.clientHeight >= div.scrollHeight - 200) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  useEffect(() => {
    return () => {
      clearSearch();
    };
  }, []);

  return (
    <div className="h-screen">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`overflow-y-auto px-6 pt-4 pb-10 ${isNative ? "max-h-[85vh]" : "max-h-[65vh] lg:max-h-[75vh] xl:max-h-[85vh]"
          }`}
      >
        {search && (
          <div className="space-y-3">
            {allUsers.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center gap-3 py-2"
                onClick={() => history.push(`/social-chat/t/${user.code}`)}
              >
                <div className=" flex items-center justify-center">
                  <img
                    src={user.avatarRoomChat || '/favicon.png'}
                    alt={user.title}
                    className="w-[50px] h-[50px] rounded-2xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/favicon.png';
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{user.title}</span>
              </div>
            ))}
            {isFetchingNextPage && <p className="text-sm text-gray-500 text-center">{t("Loading more...")}</p>}
            {!hasNextPage && allUsers.length > 0 && <p className="text-sm text-gray-400 text-center">{t("No more results")}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialChatSearch;
