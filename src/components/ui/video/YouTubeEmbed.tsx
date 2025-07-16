import React from 'react';

type AspectRatio = '16:9' | '4:3' | '21:9' | '1:1';

interface YouTubeEmbedProps {
  videoId: string;
  aspectRatio?: AspectRatio;
  title?: string;
  className?: string;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  aspectRatio = '16:9',
  title = 'YouTube video',
  className = '',
}) => {
  // Validate YouTube video ID format
  // YouTube video IDs are 11 characters long and contain letters, numbers, hyphens, and underscores
  const isValidVideoId = /^[a-zA-Z0-9_-]{11}$/.test(videoId);

  if (!isValidVideoId) {
    console.error('Invalid YouTube video ID:', videoId);
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 ${className}`}
      >
        <p className="text-gray-500">Invalid video ID</p>
      </div>
    );
  }

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-4/3',
    '21:9': 'aspect-21/9',
    '1:1': 'aspect-square',
  }[aspectRatio];

  // Sanitize the video ID to ensure it's safe to use in URL
  const sanitizedVideoId = encodeURIComponent(videoId);

  return (
    <div
      className={`overflow-hidden rounded-lg ${aspectRatioClass} ${className}`}
    >
      <iframe
        src={`https://www.youtube.com/embed/${sanitizedVideoId}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
