import useBlockPageParams from '../../hooks/useBlockPageParams';
import { MessagesService } from '../../services/MessagesService';
import type { UnblockRequestMessage } from '../../types/messages';

const BlockPageApp = () => {
  const { ruleIds, targetUrl } = useBlockPageParams();

  const handleUnblock = () => {
    if (ruleIds && targetUrl) {
      const message: UnblockRequestMessage = {
        type: 'UNBLOCK_REQUEST',
        payload: { ruleIds, targetUrl },
      };
      MessagesService.sendMessage(message).catch(console.error);
    }
  };

  return (
    <div>
      <h1>Block Page</h1>
      <button onClick={handleUnblock}>Unblock</button>
    </div>
  );
};

export default BlockPageApp;
