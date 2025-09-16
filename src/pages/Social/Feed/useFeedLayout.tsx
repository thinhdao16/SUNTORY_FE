import FeedSearch from './FeedSearch';
import FeedListRequest from './FeedListRequest';
import CreatePost from './CreateFeed/CreateFeed';
import SearchIcon from '@/icons/logo/social-chat/search.svg?react';
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import BackInputIcon from '@/icons/logo/back-default.svg?react';
import FeedCamera from './Camera/FeedCamera';
import FeedCameraWeb from './Camera/FeedCameraWeb';
import { Capacitor } from '@capacitor/core';
import { SocialFeedList } from './SocialFeedList/SocialFeedList';
import FeedDetail from './FeedDetail/FeedDetail';


export function useFeedLayout(
  type: string | undefined, 
  goTo: (path: string) => void, 
  clearSearch?: () => void,
  infoRoom?: string
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
    case 'list-request':
      contentComponent = <FeedListRequest />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-feed/search')} />
      );
      inputOnFocus = () => goTo('/social-feed/search');
      break;
    default:
      contentComponent = <SocialFeedList />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-feed/search')} />
      );
      inputOnFocus = () => goTo('/social-feed/search');
      break;
  }

  return { contentComponent, leftIcon, rightIcon, inputOnFocus };
}