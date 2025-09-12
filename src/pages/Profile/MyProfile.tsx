import React, { useState } from "react";
import { IonContent, IonPage, IonIcon, IonButton, IonTitle, IonButtons, IonHeader, IonToolbar } from "@ionic/react";
import { useAuthInfo } from "../Auth/hooks/useAuthInfo";
import PageContainer from "@/components/layout/PageContainer";
import { useHistory } from "react-router-dom";

// Import icons
import HeartIcon from "@/icons/logo/social-chat/heart.svg?react";
import MoreIcon from "@/icons/logo/social-chat/more-action.svg?react";
import ShareIcon from "@/icons/logo/social-chat/share-qr-code.svg?react";
import { arrowBack, cameraOutline, copyOutline, createOutline } from "ionicons/icons";

// Mock data cho posts
const mockPosts = [
  {
    id: 1,
    content: "This cat is both beautiful and a little foolish. Maybe \"beautifool\" describes him perfectly.",
    hashtags: ["#yoga", "#healthy"],
    likes: 3800,
    comments: 1300,
    reposts: 704,
    shares: 12,
    timeAgo: "1m",
    isPublic: true,
    images: []
  },
  {
    id: 2,
    content: "This cat is both beautiful and a little foolish. Maybe \"beautifool\" describes him perfectly.",
    hashtags: ["#yoga", "#healthy"],
    likes: 2500,
    comments: 800,
    reposts: 450,
    shares: 8,
    timeAgo: "1m",
    isPublic: false,
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop"
    ]
  }
];

const mockMedia = [
  {
    id: 1,
    type: "image",
    url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
    likes: 1200,
    comments: 300
  },
  {
    id: 2,
    type: "image",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    likes: 800,
    comments: 150
  }
];

const mockLikes = [
  {
    id: 1,
    content: "Amazing yoga pose! 🧘‍♀️",
    author: "Sarah",
    timeAgo: "2h",
    likes: 500
  },
  {
    id: 2,
    content: "Healthy lifestyle goals! 💪",
    author: "Mike",
    timeAgo: "4h",
    likes: 300
  }
];

const mockReposts = [
  {
    id: 1,
    originalContent: "Great tips for healthy living!",
    originalAuthor: "HealthGuru",
    timeAgo: "1d",
    reposts: 200
  },
  {
    id: 2,
    originalContent: "Yoga benefits everyone",
    originalAuthor: "YogaMaster",
    timeAgo: "2d",
    reposts: 150
  }
];

// Tab Navigation Component
const TabNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "posts", label: "Post" },
    { key: "media", label: "Media" },
    { key: "likes", label: "Likes" },
    { key: "reposts", label: "Reposts" }
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-3 text-center font-bold text-md relative ${activeTab === tab.key
            ? "text-gray-900"
            : "text-gray-500"
            }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-0.5 bg-black rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

// Post Item Component
const PostItem: React.FC<{ post: any }> = ({ post }) => {
  return (
    <div className="border-b border-gray-100 p-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img
            src="/favicon.png"
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">John</span>
            <span className="text-gray-500 text-sm">{post.timeAgo}</span>
            {post.isPublic ? (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            )}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-900 mb-2">{post.content}</p>
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag: string, index: number) => (
              <span key={index} className="text-blue-500 text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Images */}
      {post.images.length > 0 && (
        <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.map((image: string, index: number) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center space-x-6 text-gray-500 text-sm">
        <div className="flex items-center space-x-1">
          <HeartIcon className="w-4 h-4 text-red-500" />
          <span>{post.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span>{post.comments.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>{post.reposts.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <ShareIcon className="w-4 h-4" />
          <span>{post.shares.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// Media Grid Component
const MediaGrid: React.FC<{ media: any[] }> = ({ media }) => {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {media.map((item) => (
        <div key={item.id} className="relative group">
          <img
            src={item.url}
            alt="Media"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
              <div className="flex items-center space-x-1">
                <HeartIcon className="w-4 h-4" />
                <span className="text-sm">{item.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{item.comments}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Likes List Component
const LikesList: React.FC<{ likes: any[] }> = ({ likes }) => {
  return (
    <div className="p-4 space-y-4">
      {likes.map((like) => (
        <div key={like.id} className="border-b border-gray-100 pb-4">
          <div className="flex items-start space-x-3">
            <img
              src="/favicon.png"
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-gray-900">{like.author}</span>
                <span className="text-gray-500 text-sm">{like.timeAgo}</span>
              </div>
              <p className="text-gray-900 mb-2">{like.content}</p>
              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                <HeartIcon className="w-4 h-4 text-red-500" />
                <span>{like.likes}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Reposts List Component
const RepostsList: React.FC<{ reposts: any[] }> = ({ reposts }) => {
  return (
    <div className="p-4 space-y-4">
      {reposts.map((repost) => (
        <div key={repost.id} className="border-b border-gray-100 pb-4">
          <div className="flex items-start space-x-3">
            <img
              src="/favicon.png"
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-gray-900">John</span>
                <span className="text-gray-500 text-sm">reposted</span>
                <span className="text-gray-500 text-sm">{repost.timeAgo}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-gray-900">{repost.originalAuthor}</span>
                </div>
                <p className="text-gray-900">{repost.originalContent}</p>
              </div>
              <div className="flex items-center space-x-1 text-gray-500 text-sm mt-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>{repost.reposts}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MyProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const { data: userInfo } = useAuthInfo();
  const history = useHistory();
  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <div>
            {mockPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        );
      case "media":
        return <MediaGrid media={mockMedia} />;
      case "likes":
        return <LikesList likes={mockLikes} />;
      case "reposts":
        return <RepostsList reposts={mockReposts} />;
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <IonPage>
        <IonContent>
          <div className="min-h-screen bg-white">
            <IonHeader className="ion-no-border" style={{ '--background': '#EDF1FC', '--ion-background-color': '#ffffff' } as any}>
              <IonToolbar style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
                <IonButtons slot="start">
                  <IonButton className="opacity-0 pointer-events-none" fill="clear">
                    <IonIcon icon={createOutline} />
                  </IonButton>
                </IonButtons>
                <IonTitle className="text-2xl font-bold text-gray-900 text-center">
                  {t('My profile')}
                </IonTitle>
                <IonButtons slot="end">
                  <IonButton fill="clear">
                    <IonIcon icon={createOutline} className="text-black size-7 text-transform-uppercase" />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <hr className="border-gray-100" />

            {/* Profile Header */}
            {userInfo && (
              <div className="px-6 pt-4 pb-6">
                <div className="flex items-start justify-between">
                  {/* Left side - User info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{userInfo.name}</h1>
                      {/* Vietnam flag icon */}
                      <span className={`fi fi-${userInfo.country.code.toLowerCase()} fis`} style={{ width: 18, height: 18, borderRadius: 9999 }} ></span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p 
                        className="text-black overflow-hidden max-w-[110px] truncate" 
                        style={{
                          fontFamily: 'Inter',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '21px',
                          letterSpacing: '0%'
                        }}
                      >
                        @{userInfo.code}
                      </p>
                      {/* Copy icon */}
                      <IonIcon icon={copyOutline} className="w-4 h-4 text-black text-transform-uppercase hover:text-blue-500" onClick={() => { navigator.clipboard.writeText(userInfo.code || "") }} />
                    </div>
                     <div className="flex items-center space-x-2 mb-4">
                       <p 
                         className="text-black mb-0" 
                         style={{
                           fontFamily: 'Inter',
                           fontWeight: 500,
                           fontSize: '14px',
                           lineHeight: '21px',
                           letterSpacing: '0%'
                         }}
                       >
                         {userInfo.friendNumber}
                       </p>
                       <p 
                         className="text-gray-500 mb-0" 
                         style={{
                           fontFamily: 'Inter',
                           fontWeight: 400,
                           fontSize: '14px',
                           lineHeight: '21px',
                           letterSpacing: '0%'
                         }}
                       >
                         friends
                       </p>
                     </div>
                  </div>

                  {/* Right side - Avatar */}
                  <div className="relative ml-4">
                    <img
                      src={userInfo.avatarLink || "/favicon.png"}
                      alt="Profile"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px', // Spacing/5 = 20px
                        opacity: 1,
                        objectFit: 'cover'
                      }}
                    />
                    {/* Camera icon overlay */}
                    <div 
                      className="absolute bg-white flex items-center justify-center shadow-sm" 
                      style={{ 
                        width: '32px',
                        height: '32px',
                        gap: '16px',
                        borderRadius: '1600px',
                        borderWidth: '1.6px',
                        borderColor: '#E5E7EB',
                        padding: '6.4px',
                        top: '48px',
                        left: '-8px',
                        opacity: 1
                      }}
                    >
                      <IonIcon 
                        icon={cameraOutline} 
                        className="text-black text-transform-uppercase" 
                        style={{
                          width: '28px',
                          height: '20px',
                          opacity: 1
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons - Separate section */}
                <div className="flex items-center justify-center space-x-3 mt-4">
                  <IonButton
                    fill="clear"
                    onClick={() => history.push('/profile-setting')}
                    style={{
                      width: '200px',
                      height: '34px',
                      gap: '8px',
                      borderRadius: '12px', // Spacing/3 = 12px
                      borderWidth: '1px',
                      borderColor: '#A3A8AF',
                      padding: '8px',
                      backgroundColor: 'white',
                      color: 'black',
                      textTransform: 'none',
                      opacity: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {t('Edit profile')}
                  </IonButton>
                  <IonButton
                    fill="clear"
                    style={{
                      width: '200px',
                      height: '34px',
                      gap: '8px',
                      borderRadius: '12px', // Spacing/3 = 12px
                      borderWidth: '1px',
                      borderColor: '#A3A8AF',
                      padding: '8px',
                      backgroundColor: 'white',
                      color: 'black',
                      textTransform: 'none',
                      opacity: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {t('Share profile')}
                  </IonButton>
                </div>
              </div>
            )}
            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            {/* Tab Content */}
            <div className="flex-1">
              {renderTabContent()}
            </div>
          </div>
        </IonContent>
      </IonPage>
    </PageContainer>
  );
};

export default MyProfile;
