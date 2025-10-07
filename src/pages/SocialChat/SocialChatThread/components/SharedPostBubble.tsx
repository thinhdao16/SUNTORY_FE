import React from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFeedDetail } from "@/pages/Social/Feed/hooks/useFeedDetail";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { formatTimeFromNow } from "@/utils/formatTime";
import { GoDotFill } from "react-icons/go";
import ReactHeartIcon from "@/icons/logo/social-feed/react-heart.svg?react";
import CommentsIcon from "@/icons/logo/social-feed/comments.svg?react";
import RetryIcon from "@/icons/logo/social-feed/retry.svg?react";
import SendIcon from "@/icons/logo/social-feed/send.svg?react";
import { PrivacyPostType } from "@/types/privacy";
import MediaDisplay from "@/components/social/MediaDisplay";
import GlobalIcon from "@/icons/logo/social-feed/global-default.svg?react";
import FriendIcon from "@/icons/logo/social-feed/friend-default.svg?react";
import LockIcon from "@/icons/logo/social-feed/lock-default.svg?react";
import { parseHashtagsWithClick } from "@/utils/hashtagHighlight";

export interface SharedPostBubbleProps {
  data: any; // expects { PostCode, MessageShare }
  isUser: boolean;
}

const getPrivacyIcon = (privacy?: number) => {
  switch (privacy) {
    case PrivacyPostType.Public:
      return <GlobalIcon className="w-3 h-3 text-gray-500" />;
    case PrivacyPostType.Friend:
      return <FriendIcon className="w-3 h-3 text-gray-500" />;
    case PrivacyPostType.Private:
      return <LockIcon className="w-3 h-3 text-gray-500" />;
    case PrivacyPostType.Hashtag:
      return <GlobalIcon className="w-3 h-3 text-gray-500" />;
    default:
      return <GlobalIcon className="w-3 h-3 text-gray-500" />;
  }
};

const SharedPostSkeleton: React.FC = () => (
  <div className="space-y-2" aria-busy="true">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-200 rounded-xl" />
      <div className="h-4 bg-gray-200 rounded w-32" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-2/3" />
    <div className="h-40 bg-gray-200 rounded" />
  </div>
);

export const SharedPostBubble: React.FC<SharedPostBubbleProps> = ({ data, isUser }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const parsed = React.useMemo(() => {
    if (!data) return {} as any;
    if (typeof data === "string") {
      try { return JSON.parse(data); } catch { return {} as any; }
    }
    return data as any;
  }, [data]);

  const postCode = parsed?.PostCode || parsed?.postCode;
  const { post: sharedPost, isLoadingPost: loadingShared } = useFeedDetail(postCode, !!postCode);

  const isRepost = !!(sharedPost?.isRepost && sharedPost?.originalPost);
  const displayPost: any = isRepost ? sharedPost?.originalPost : sharedPost;

  return (
    <div
      className={`w-fit relative z-[1] ${isUser
          ? " text-black rounded-br-md rounded-[16px_16px_4px_16px]"
          : " text-black rounded-[4px_16px_16px_16px]"
        }`}
      style={{ maxWidth: "calc(100vw - 130px)" }}
    >
      <div className="flex">
        <div className="w-full  min-w-[40px] lg:max-w-[250px] xl:max-w-[250px] ">
          {parsed.MessageShare && (
            <div className={` leading-snug relative p-3  ${isUser
                ? "bg-primary-100 text-black rounded-[16px_16px_0px_0px]"
                : "bg-success-500 text-black rounded-[4px_16px_0px_0px]"
              }`}>{parsed.MessageShare}</div>
          )}

          <button
            className="w-full text-left"
            onClick={() => {
              const targetCode = isRepost ? sharedPost?.originalPost?.code : sharedPost?.code;
              if (targetCode) history.push(`/social-feed/f/${sharedPost?.code}`);
            }}
            disabled={!sharedPost}
          >
            <div className={`  bg-[#F0F0F099] p-3 ${parsed.MessageShare ? "rounded-b-2xl" : `${isUser ? "rounded-[16px_16px_4px_16px]" : "rounded-[4px_16px_16px_16px]"}`}`}
            >
              {loadingShared || !sharedPost ? (
                <SharedPostSkeleton />
              ) : (
                <div>
                  {isRepost && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={sharedPost?.user?.avatarUrl || avatarFallback}
                          alt={sharedPost?.user?.fullName || "User"}
                          className="w-8 h-8 rounded-xl object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = avatarFallback)}
                        />
                        <div className="flex flex-col justify-center">
                          <div className="font-semibold text-gray-800 truncate max-w-[150px]">
                            {sharedPost?.user?.fullName || "User"}
                          </div>
                          {sharedPost?.createDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>{formatTimeFromNow(sharedPost.createDate, t)}</span>
                              <GoDotFill className="w-2 h-2" />
                              <span className="opacity-20">{getPrivacyIcon(sharedPost?.privacy)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={isRepost ? "border border-gray-200 rounded-lg p-3" : ""}>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={displayPost?.user?.avatarUrl || avatarFallback}
                        alt={displayPost?.user?.fullName || "Post User"}
                        className="w-8 h-8 rounded-xl object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = avatarFallback)}
                      />
                      <div className="grid">
                        <div className="font-semibold text-gray-800 truncate max-w-[200px]">
                          {displayPost?.user?.fullName || "User"}
                        </div>
                        {displayPost?.createDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{formatTimeFromNow(displayPost.createDate, t)}</span>
                            <GoDotFill className="w-2 h-2" />
                            <span className="opacity-20">{getPrivacyIcon(displayPost?.privacy)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {displayPost?.content && (
                      <div className="text-gray-800 leading-relaxed line-clamp-2 mb-2">
                            {parseHashtagsWithClick(displayPost?.content || '')}
                      </div>
                    )}
                    {/* {Array.isArray(displayPost?.hashtags) && displayPost.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 text-blue-600 text-sm">
                        {displayPost.hashtags.slice(0, 5).map((h: any) => (
                          <span key={h.id}>#{h.tag || h.hashtagTag}</span>
                        ))}
                      </div>
                    )} */}
                    {Array.isArray(displayPost?.media) && displayPost.media.length > 0 && (
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <MediaDisplay
                          mediaFiles={displayPost.media}
                          className=""
                          lightboxUserName={displayPost?.user?.fullName}
                          lightboxUserAvatar={displayPost?.user?.avatarUrl}
                          classNameAudio=""
                          customLengthAudio={11}
                          singleWrapperClassName="px-0"
                          multiWrapperClassName="flex gap-3 px-0 overflow-x-auto scrollbar-thin"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-gray-600">
                    <div className="flex items-center gap-1">
                      <ReactHeartIcon className="w-4 h-4" />
                      <span className="text-sm">{displayPost?.reactionCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CommentsIcon className="w-4 h-4" />
                      <span className="text-sm">{displayPost?.commentCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RetryIcon className="w-4 h-4" />
                      <span className="text-sm">{displayPost?.repostCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SendIcon className="w-4 h-4" />
                      <span className="text-sm">{displayPost?.shareCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedPostBubble;
