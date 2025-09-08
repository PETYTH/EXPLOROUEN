import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ChatMessage } from '@/services/chatService';

interface MediaMessageProps {
  message: ChatMessage;
  isMe: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const maxMediaWidth = screenWidth * 0.7;

export default function MediaMessage({ message, isMe }: MediaMessageProps) {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);

  const renderImage = () => (
    <View style={[styles.mediaContainer, { backgroundColor: colors.surface }]}>
      <Image
        source={{ uri: message.mediaUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      {message.content && (
        <Text style={[styles.caption, { color: colors.text }]}>
          {message.content}
        </Text>
      )}
    </View>
  );

  const renderVideo = () => (
    <View style={[styles.mediaContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: message.mediaUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping={false}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if ('isPlaying' in status) {
              setIsPlaying(status.isPlaying);
            }
          }}
        />
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause size={24} color="#FFFFFF" />
          ) : (
            <Play size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      {message.content && (
        <Text style={[styles.caption, { color: colors.text }]}>
          {message.content}
        </Text>
      )}
    </View>
  );

  const renderContent = () => {
    switch (message.messageType) {
      case 'IMAGE':
        return renderImage();
      case 'VIDEO':
        return renderVideo();
      default:
        return (
          <Text style={[styles.textMessage, { color: colors.text }]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[
      styles.messageWrapper,
      isMe ? styles.myMessage : styles.otherMessage
    ]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    maxWidth: maxMediaWidth,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    padding: 4,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {
    padding: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  textMessage: {
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
  },
});
