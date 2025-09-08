import { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import BackIcon from "@/icons/logo/back-default.svg?react";
import { HiX } from "react-icons/hi";
import { useHistory, useParams } from "react-router";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import avatarGrayFallback from "@/icons/logo/social-chat/avt-gray-rounded.svg";
import { t } from "@/lib/globalT";
import { useDebounce } from "@/hooks/useDebounce";
import SearchIcon from '@/icons/logo/social-chat/search.svg?react';
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import CheckboxSelectIcon from "@/icons/logo/checkbox-select.svg?react";
import { Capacitor } from "@capacitor/core";
// Import useAddGroupMembers thay vì useCreateChatGroup
import { useAddGroupMembers } from "@/pages/SocialChat/hooks/useSocialChat";
import { useFriendExcludeRoom } from "@/pages/SocialPartner/hooks/useSocialPartner";

function SocialChatAddMembers() {
  const isNative = Capacitor.isNativePlatform();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const history = useHistory();

  const debouncedSearch = useDebounce(search, 500);
  const { roomId } = useParams<{ roomId: string }>();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFriendExcludeRoom(roomId, 20, debouncedSearch);

  const { mutate: addMembers, isLoading: adding } = useAddGroupMembers({
    onSuccess: () => {
      history.push(`/social-chat/t/${roomId}`);
    }
  });

  const users = data?.pages.flat() ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayUsers = users;

  useEffect(() => {
    if (debouncedSearch) {
      setSelectedUsers([]); 
    }
  }, [debouncedSearch]);

  const toggleUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const removeSelected = (id: number) => {
    setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
  };

  const handleAddMembers = () => {
    if (selectedUsers.length === 0 || !roomId) return;

    addMembers({
      chatCode: roomId,
      userIds: selectedUsers,
    });
  };

  const handleClearSearch = () => {
    setSearch("");
    inputRef.current?.blur();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="bg-white min-h-screen py-3">
      <div className="px-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => history.goBack()} className="text-gray-500">
              <BackIcon />
            </button>
            <h2 className="font-semibold">{t("Add Member")}</h2>
          </div>
          {/* Thay đổi hàm handleCreateGroup thành handleAddMembers */}
          <button 
            onClick={handleAddMembers} 
            disabled={adding || selectedUsers.length === 0}
          >
            <span className={`font-semibold ${selectedUsers.length > 0 ? "text-blue-600" : "text-gray-400"}`}>
              {adding ? t("Adding...") : t("Add")}
            </span>
          </button>
        </div>
        
        {selectedUsers.length > 0 && (
          <div className="flex gap-[15px] mb-3 overflow-x-auto w-full pt-2">
            {selectedUsers.map((id) => {
              const user = users.find((u) => u.id === id);
              return (
                <div key={id} className="relative z-9 text-center flex flex-col gap-1 items-center justify-center">
                  <img
                    src={user?.avatar || avatarGrayFallback}
                    alt={user?.fullName}
                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-2xl object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = avatarGrayFallback;
                    }}
                  />
                  <button
                    onClick={() => removeSelected(id)}
                    className="absolute z-20 -top-1 -right-1"
                  >
                    <div className="bg-success-500 text-black rounded-full w-5 h-5 flex items-center justify-center">
                      <HiX className="text-[14px]" />
                    </div>
                  </button>
                  <p className="text-xs text-center max-w-[40px] truncate">{user?.fullName}</p>
                </div>
              );
            })}
          </div>
        )}
      
        <div className="flex items-center bg-chat-to rounded-lg px-4 py-2">
          <SearchIcon className="text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("Search")}
            className="flex-grow bg-transparent text-sm focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <ClearInputIcon
              onClick={handleClearSearch}
              className="cursor-pointer"
            />
          )}
        </div>
        {search && debouncedSearch !== search && (
          <div className="text-sm text-gray-500 text-center">
            {t("Searching...")}
          </div>
        )}
      </div>
      <div className={`px-6 mt-4 overflow-y-auto pb-28 ${isNative
        ? "max-h-[75vh]"
        : "max-h-[65vh] lg:max-h-[65vh] xl:max-h-[75vh]"
        }`}>
        {displayUsers.length > 0 && !search && (
          <h3 className="text-sm text-netural-500 mb-4">
            {t("Suggestion")}
          </h3>
        )}

        {search && displayUsers.length > 0 && (
          <h3 className="text-sm text-netural-500 mb-4">
            {t("Search Results")} ({displayUsers.length})
          </h3>
        )}

        <div ref={scrollRef} className="space-y-3">
          {isLoading ? (
            <p className="text-center text-gray-400">{t("Loading...")}</p>
          ) : displayUsers.length === 0 ? (
            <div className="flex flex-col items-center text-center text-gray-500 mt-20">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-xl mb-3">
                <FiSearch />
              </div>
              <p>
                {search 
                  ? t("No relevant search results found.")
                  : t("No friends found.")
                }
              </p>
            </div>
          ) : (
            displayUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between pb-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`checkbox-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="peer hidden"
                  />
                  <label
                    htmlFor={`checkbox-${user.id}`}
                    className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer
                    ${selectedUsers.includes(user.id) ? "bg-main border-main" : "border-neutral-300 bg-white"}`}>
                    {selectedUsers.includes(user.id) && (
                      <CheckboxSelectIcon />
                    )}
                  </label>
                  <img
                    src={user.avatar || avatarFallback}
                    alt={user.fullName}
                    className="w-[50px] h-[50px] rounded-2xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = avatarFallback;
                    }}
                  />
                  <div className="">
                    <span className="font-medium">{user.fullName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {isFetchingNextPage && (
            <p className="text-center text-gray-400 text-sm">{t("Loading more...")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialChatAddMembers;