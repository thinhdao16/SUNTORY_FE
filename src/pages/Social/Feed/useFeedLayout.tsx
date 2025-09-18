import FeedSearch from './FeedSearch';
import SearchResult from './SearchResult';
import CreatePost from './CreateFeed/CreateFeed';
import SearchIcon from '@/icons/logo/social-chat/search.svg?react';
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import BackInputIcon from '@/icons/logo/back-default.svg?react';
import FeedCamera from './Camera/FeedCamera';
import FeedCameraWeb from './Camera/FeedCameraWeb';
import { Capacitor } from '@capacitor/core';
import { SocialFeedList } from './SocialFeedList/SocialFeedList';
import FeedDetail from './FeedDetail/FeedDetail';
import EditFeed from './EditFeed/EditFeed';


export function useFeedLayout(
  type: string | undefined,
  goTo: (path: string) => void,
  clearSearch?: () => void,
  infoRoom?: string,
  tabName?: string
) {
  let contentComponent = null;
  let leftIcon = null;
  let rightIcon = null;
  let inputOnFocus = () => { };
  switch (type) {
    case 'search':
      contentComponent = <FeedSearch />;
      leftIcon = <button type="button" onClick={() => goTo('/social-feed')}> <BackInputIcon /></button>;
      rightIcon = <button type="button" onClick={clearSearch}> <ClearInputIcon /></button>;
      break;
    case 'search-result':
      contentComponent = <SearchResult />;
      leftIcon = <button type="button" onClick={() => goTo('/social-feed/search')}> <BackInputIcon /></button>;
      rightIcon = <button type="button" onClick={clearSearch}> <ClearInputIcon /></button>;
      break;
    case 'f':
      if (infoRoom === 'info') {
      } else {
        contentComponent = <FeedDetail />;
      }
      break;
    case 'camera':
      contentComponent = Capacitor.isNativePlatform() ? <FeedCamera /> : <FeedCameraWeb />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-feed/search')} />
      );
      inputOnFocus = () => goTo('/social-feed/search');
      break;
    case 'create':
      contentComponent = <CreatePost />;
      break;
    case 'edit':
      contentComponent = <EditFeed />;
      break;
    case 'recent':
      let activeTab = 'everyone';
      let specificHashtag = '';
      if (tabName) {
        const decodedTab = decodeURIComponent(tabName);
        console.log(tabName)
        if (decodedTab.startsWith('Hashtags=')) {
          const hashtag = decodedTab.split('=')[1];
          activeTab = `#${hashtag}`; 
          specificHashtag = hashtag;
        } else {
          switch (decodedTab) {
            case 'your-friends':
            case 'your%20friends':
              activeTab = 'your-friends';
              break;
            case 'for-you':
            case 'for%20you':
              activeTab = 'for-you';
              break;
            case 'Hashtags':
              activeTab = 'Hashtags';
              break;
            case 'Everyone':
            case 'everyone':
              activeTab = 'everyone';
              break;
            default:
              activeTab = 'everyone';
          }
        }
      }
      
      contentComponent = <SocialFeedList activeTab={activeTab} specificHashtag={specificHashtag} />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-feed/search')} />
      );
      inputOnFocus = () => goTo('/social-feed/search');
      break;
    default:
      contentComponent = <SocialFeedList activeTab="everyone" />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-feed/search')} />
      );
      inputOnFocus = () => goTo('/social-feed/search');
      break;
  }

  return { contentComponent, leftIcon, rightIcon, inputOnFocus };
}