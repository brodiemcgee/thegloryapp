// Chat view - individual conversation with message input

'use client';

import { useState, useRef, useEffect } from 'react';
import { Conversation, Album } from '@/types';
import { ChevronLeftIcon, SendIcon, CheckIcon, DotsVerticalIcon, FlagIcon, BlockIcon, TrashIcon, ImageIcon, XIcon } from './icons';
import { ChatAttachmentMenu, AlbumPickerModal, AlbumShareBubble } from './chat';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useAlbumAccess } from '@/hooks/useAlbumAccess';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useAuth } from '@/hooks/useAuth';
import ReportModal from './ReportModal';
import BlockConfirmModal from './BlockConfirmModal';
import { useBlock } from '@/hooks/useBlock';
import { useReport } from '@/hooks/useReport';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useUserInteraction } from '@/hooks/useUserInteraction';
import { useConversations } from '@/contexts/ConversationsContext';
import EncounterFormModal from './EncounterFormModal';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

// Helper to check if a conversation ID looks like a mock/local conversation
const isMockConversation = (id: string): boolean => {
  // Mock conversations start with 'conv-' or don't have a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(id);
};

export default function ChatView({ conversation, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { blockUser, isBlocked } = useBlock();
  const { submitReport } = useReport();
  const { upload, uploading, progress, error: uploadError } = usePhotoUpload();
  const { grantAccess } = useAlbumAccess();
  const { getLocalMessages, addLocalMessage } = useConversations();

  // Check if this is a mock conversation
  const isMock = isMockConversation(conversation.id);

  // User interaction hooks for favorites, notes, and encounters
  const {
    isFavorite,
    notes,
    hasMet,
    encounters,
    toggleFavorite,
    updateNotes,
    addEncounter,
  } = useUserInteraction(conversation.user.id);

  // Sync notes text with stored notes
  useEffect(() => {
    setNotesText(notes);
  }, [notes]);

  // Use Realtime hooks for real conversations, local messages for mock ones
  const realtimeHooks = useRealtimeMessages({
    conversationId: isMock ? 'skip' : conversation.id,
    otherUserId: conversation.user.id,
  });

  // Get messages from either realtime (for real convos) or local storage (for mock convos)
  const localMessages = getLocalMessages(conversation.id);
  const messages = isMock ? localMessages : realtimeHooks.messages;
  const loading = isMock ? false : realtimeHooks.loading;

  const { isOtherUserTyping, setTyping } = useTypingIndicator(
    isMock ? 'skip' : conversation.id,
    conversation.user.id
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark unread messages as read when viewed (only for real conversations)
  useEffect(() => {
    if (isMock || !user || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg) => msg.sender_id === conversation.user.id && !msg.read_at
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg.id);
      realtimeHooks.markAsRead(messageIds);
    }
  }, [isMock, messages, user, conversation.user.id, realtimeHooks]);

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    let imageUrl = '';

    // Upload image if selected (only for real conversations)
    if (selectedImage && user && !isMock) {
      try {
        const result = await upload(selectedImage, user.id, 'chat', conversation.id);
        imageUrl = result.url;
      } catch (err) {
        console.error('Failed to upload image:', err);
        alert('Failed to upload image');
        return;
      }
    }

    const messageContent = input.trim() || 'Image';

    if (isMock) {
      // For mock conversations, add to local state
      const mockUserId = user?.id || 'mock-current-user';
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender_id: mockUserId,
        receiver_id: conversation.user.id,
        content: messageContent,
        image_url: imagePreview || undefined, // Use local preview for mock
        created_at: new Date().toISOString(),
        read_at: undefined,
      };
      addLocalMessage(conversation.id, newMessage);
    } else {
      // Send message with optional image via realtime
      await realtimeHooks.sendMessage(messageContent, imageUrl);
    }

    setInput('');
    setImagePreview(null);
    setSelectedImage(null);
    setTyping(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setSelectedImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Broadcast typing status
    if (value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReport = (reason: any, details: string) => {
    submitReport(conversation.user.id, 'user', reason, details);
    setShowReportModal(false);
  };

  const handleBlock = () => {
    blockUser(conversation.user.id);
    setShowBlockModal(false);
    onBack(); // Go back after blocking
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
      // TODO: Implement clear chat functionality
      setShowMenu(false);
    }
  };

  // Helper to validate UUID format
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleAlbumShare = async (album: Album) => {
    setShowAlbumPicker(false);

    // Validate UUIDs before attempting to share
    // Mock data uses simple IDs like "1", "2" which aren't valid UUIDs
    if (!isValidUUID(conversation.user.id) || !isValidUUID(conversation.id)) {
      alert('Album sharing requires a real conversation. This appears to be demo data.');
      return;
    }

    // Grant access to the recipient
    const grantId = await grantAccess(album.id, conversation.user.id, conversation.id);
    if (!grantId) {
      alert('Failed to share album');
      return;
    }

    // Send message with album share
    const albumShare = {
      album_id: album.id,
      album_name: album.name,
      item_count: album.item_count,
      preview_url: album.cover_url,
    };

    await realtimeHooks.sendMessage('Shared an album', undefined, albumShare);
  };

  // Filter out messages from blocked users
  const visibleMessages = messages.filter(
    (msg) => !isBlocked(msg.sender_id) && !isBlocked(msg.receiver_id)
  );

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-hole-border bg-hole-surface">
        <button
          onClick={onBack}
          className="p-2 hover:bg-hole-border rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="relative">
          <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center">
            {conversation.user.avatar_url ? (
              <img
                src={conversation.user.avatar_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-lg text-hole-muted">?</span>
            )}
          </div>
          {conversation.user.is_online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-hole-surface" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-medium">{conversation.user.username}</span>
            {conversation.user.is_verified && (
              <CheckIcon className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <p className="text-xs text-hole-muted">
            {isOtherUserTyping ? 'Typing...' : conversation.user.is_online ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* User interaction buttons */}
        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-lg transition-colors ${
            isFavorite ? 'text-red-500' : 'hover:bg-hole-border text-hole-muted'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Notes button - only show when favorited */}
        {isFavorite && (
          <button
            onClick={() => setShowNotesModal(true)}
            className={`p-2 rounded-lg transition-colors ${
              notes ? 'text-yellow-500' : 'hover:bg-hole-border text-hole-muted'
            }`}
            aria-label="View notes"
          >
            <svg className="w-5 h-5" fill={notes ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {/* Met button - opens encounter modal */}
        <button
          onClick={() => setShowEncounterModal(true)}
          className={`p-2 rounded-lg transition-colors ${
            hasMet ? 'text-green-500' : 'hover:bg-hole-border text-hole-muted'
          }`}
          aria-label="Log encounter"
        >
          <svg className="w-5 h-5" fill={hasMet ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-hole-border rounded-lg transition-colors"
            aria-label="More options"
          >
            <DotsVerticalIcon className="w-5 h-5" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-hole-surface border border-hole-border rounded-lg shadow-lg overflow-hidden z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left"
                >
                  <FlagIcon className="w-5 h-5" />
                  <span>Report</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left text-hole-accent"
                >
                  <BlockIcon className="w-5 h-5" />
                  <span>Block</span>
                </button>
                <div className="border-t border-hole-border" />
                <button
                  onClick={handleClearChat}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left text-hole-muted"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Clear Chat</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-hole-muted">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-hole-muted">No messages yet. Say hi!</p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMine = !!(user && msg.sender_id === user.id);

            // Render album share message
            if (msg.album_share) {
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <AlbumShareBubble
                    albumShare={msg.album_share}
                    isMine={isMine}
                    timestamp={msg.created_at}
                    isRead={!!msg.read_at}
                  />
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl ${
                    isMine
                      ? 'bg-hole-accent text-white rounded-br-md'
                      : 'bg-hole-surface text-white rounded-bl-md'
                  } ${msg.image_url ? 'p-2' : 'px-4 py-2'}`}
                >
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt=""
                      className="rounded-lg max-w-full mb-2 cursor-pointer"
                      onClick={() => window.open(msg.image_url, '_blank')}
                    />
                  )}
                  {msg.content && msg.content !== 'Image' && (
                    <p className={`break-words ${msg.image_url ? 'px-2' : ''}`}>{msg.content}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${msg.image_url ? 'px-2 pb-1' : ''} ${
                      isMine ? 'text-red-200' : 'text-hole-muted'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                    {isMine && msg.read_at && (
                      <span className="ml-1">✓✓</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-hole-surface px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-hole-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-hole-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-hole-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-hole-border safe-bottom">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-24 rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-hole-accent rounded-full transition-colors hover:bg-hole-accent-hover"
              aria-label="Remove image"
            >
              <XIcon className="w-4 h-4" />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-xs text-white">{progress}%</div>
              </div>
            )}
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-500">{uploadError}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Attachment menu */}
          <ChatAttachmentMenu
            onSelectPhoto={() => fileInputRef.current?.click()}
            onSelectAlbum={() => setShowAlbumPicker(true)}
            disabled={uploading}
          />

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !uploading && handleSend()}
            placeholder="Type a message..."
            disabled={uploading}
            className="flex-1 bg-hole-surface border border-hole-border rounded-full px-4 py-3 outline-none focus:border-hole-accent transition-colors disabled:opacity-50"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || uploading}
            className="p-3 bg-hole-accent rounded-full transition-colors hover:bg-hole-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showReportModal && (
        <ReportModal
          targetId={conversation.user.id}
          targetType="user"
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
        />
      )}
      {showBlockModal && (
        <BlockConfirmModal
          username={conversation.user.username}
          onConfirm={handleBlock}
          onClose={() => setShowBlockModal(false)}
        />
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNotesModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notes about {conversation.user.username}</h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Write private notes about this person..."
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
              rows={6}
            />

            <p className="text-xs text-hole-muted">
              These notes are private and only visible to you.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateNotes(notesText);
                  setShowNotesModal(false);
                }}
                className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encounter Modal */}
      {showEncounterModal && (
        <EncounterFormModal
          onClose={() => setShowEncounterModal(false)}
          onSave={async (encounter) => {
            await addEncounter(encounter);
          }}
          username={conversation.user.username}
          previousEncounterCount={encounters?.length || 0}
        />
      )}

      {/* Album Picker Modal */}
      <AlbumPickerModal
        isOpen={showAlbumPicker}
        onClose={() => setShowAlbumPicker(false)}
        onSelect={handleAlbumShare}
      />
    </div>
  );
}
