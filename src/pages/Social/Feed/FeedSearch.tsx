import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SocialStorySearch: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery] = useState('Carl');

    const tabs = ['All', 'Latest', 'People', 'Post'];

    const searchResults = [
        {
            id: 1,
            type: 'user',
            user: {
                name: 'Carl',
                username: 'Carl155',
                avatar: '/api/placeholder/40/40',
                posts: '4 new posts'
            }
        },
        {
            id: 2,
            type: 'user', 
            user: {
                name: 'Carlson',
                username: 'Carlson001',
                avatar: '/api/placeholder/40/40'
            }
        },
        {
            id: 3,
            type: 'user',
            user: {
                name: 'Carlson_James',
                username: 'Carlson_James123456',
                avatar: '/api/placeholder/40/40'
            }
        },
        {
            id: 4,
            type: 'post',
            user: {
                name: 'Carl',
                avatar: '/api/placeholder/40/40',
                isVerified: true
            },
            content: 'This cat is both beautiful and a little foolish. Maybe "beautiful" describes him perfectly.',
            hashtags: ['#healthy'],
            likes: 3800,
            comments: 1300,
            shares: 704,
            reposts: 12
        },
        {
            id: 5,
            type: 'post',
            user: {
                name: 'Journalist',
                avatar: '/api/placeholder/40/40',
                isVerified: true
            },
            content: 'This cat is both beautiful and a little foolish. His name is Carl.',
            hashtags: ['#healthy'],
            likes: 3800,
            comments: 1300,
            shares: 704,
            reposts: 12,
            images: ['/api/placeholder/300/200']
        }
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Search tabs */}
            <div className="flex border-b border-gray-200 px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-center text-sm font-medium ${
                            activeTab === tab
                                ? 'text-blue-500 border-b-2 border-blue-500'
                                : 'text-gray-500'
                        }`}
                    >
                        {t(tab)}
                    </button>
                ))}
            </div>

            {/* Search results */}
            <div className="p-4">
                {/* People section */}
                {(activeTab === 'All' || activeTab === 'People') && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800">{t('People')}</h3>
                            <button className="text-blue-500 text-sm">{t('See all')}</button>
                        </div>
                        
                        <div className="space-y-3">
                            {searchResults.filter(item => item.type === 'user').map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <img 
                                        src={item.user.avatar} 
                                        alt={item.user.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{item.user.name}</div>
                                        <div className="text-gray-500 text-xs">{item.user.username}</div>
                                        {item.user.posts && (
                                            <div className="text-blue-500 text-xs">{item.user.posts}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts section */}
                {(activeTab === 'All' || activeTab === 'Post') && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800">{t('Post')}</h3>
                            <button className="text-blue-500 text-sm">{t('See all')}</button>
                        </div>
                        
                        <div className="space-y-4">
                            {searchResults.filter(item => item.type === 'post').map((post) => (
                                <div key={post.id} className="bg-white border border-gray-100 rounded-lg">
                                    {/* Post header */}
                                    <div className="flex items-center gap-3 p-4">
                                        <img 
                                            src={post.user.avatar} 
                                            alt={post.user.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-sm">{post.user.name}</span>
                                                {post.user.isVerified && (
                                                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post content */}
                                    <div className="px-4 pb-3">
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {post.content}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            {post.hashtags?.map((tag, index) => (
                                                <span key={index} className="text-blue-500 text-sm">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Post image if exists */}
                                    {post.images && (
                                        <div className="px-4 pb-3">
                                            <img 
                                                src={post.images[0]} 
                                                alt=""
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Post actions */}
                                    <div className="flex items-center gap-6 px-4 pb-4">
                                        <button className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{post.likes?.toLocaleString()}</span>
                                        </button>
                                        
                                        <button className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{post.comments?.toLocaleString()}</span>
                                        </button>
                                        
                                        <button className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{post.shares}</span>
                                        </button>
                                        
                                        <button className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{post.reposts}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No results for other tabs */}
                {activeTab === 'Latest' && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-gray-500 mb-2">{t('We couldn\'t find any results.')}</p>
                        <p className="text-gray-400 text-sm">{t('Make sure everything is spelled correctly, or try different keywords.')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialStorySearch;
