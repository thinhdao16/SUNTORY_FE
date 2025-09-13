import SocialChatRecent from './SocialChatRecent/SocialChatRecent';
import SocialChatSearch from './SocialChatSearch';
import SocialChatThread from './SocialChatThread/SocialChatThread';
import SocialChatListRequest from './SocialChatListRequest';
import SocialChatInfo from './SocialChatInfo/SocialChatInfo'; 
import SocialChatMembers from './SocialChatInfo/SocialChatMembers'; 
import SearchIcon from '@/icons/logo/social-chat/search.svg?react';
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import BackInputIcon from '@/icons/logo/vector_left.svg?react';
import SocialChatCamera from './SocialChatCamera/SocialChatCamera';
import SocialChatCameraWeb from './SocialChatCamera/SocialChatCameraWeb';
import SocialChatAddMembers from './SocialChatInfo/SocialChatAddMembers';
import SocialChatViewAttachments from './SocialChatInfo/SocialChatViewAttachments';


export function useSocialChatLayout(
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
      contentComponent = <SocialChatSearch />;
      leftIcon = (
        <button onClick={() => goTo('/social-chat')}>
          <BackInputIcon />
        </button>
      );
      rightIcon = <button type="button" onClick={clearSearch}> <ClearInputIcon /></button>;
      break;
    case 't':
      if (infoRoom === 'info') {
        contentComponent = <SocialChatInfo />;
      } else if (infoRoom === 'members') {
        contentComponent = <SocialChatMembers />;
      } else if (infoRoom === 'add-members') {
        contentComponent = <SocialChatAddMembers />;
      } else if (infoRoom === 'view-attachments') {
        contentComponent = <SocialChatViewAttachments />;
      } else {
        contentComponent = <SocialChatThread />;
      }
      break;
    case 'camera':
      contentComponent = <SocialChatCamera />;
      break;
    case 'camera-web':
      contentComponent = <SocialChatCameraWeb />;
      break;
    case 'list-request':
      contentComponent = <SocialChatListRequest />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-chat/search')} />
      );
      inputOnFocus = () => goTo('/social-chat/search');
      break;
    case undefined:
    default:
      contentComponent = <SocialChatRecent />;
      leftIcon = (
        <SearchIcon onClick={() => goTo('/social-chat/search')} />
      );
      inputOnFocus = () => goTo('/social-chat/search');
      break;
  }

  return { contentComponent, leftIcon, rightIcon, inputOnFocus };
}