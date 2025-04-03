'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/app/hooks/useSocket';

interface TimelineEvent {
  id: string;
  type: 'MEMBER_JOINED' | 'CHALLENGE_CREATED' | 'CHALLENGE_COMPLETED' | 'MEMBER_LEFT';
  userId: string;
  userEmail: string;
  userName?: string;
  timestamp: Date;
  metadata?: any;
}

interface ClubTimelineProps {
  clubId: string;
  initialEvents?: TimelineEvent[];
}

export function ClubTimeline({ clubId, initialEvents = [] }: ClubTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const { subscribeToClub, onClubUpdate } = useSocket();

  useEffect(() => {
    // Subscribe to club updates
    subscribeToClub(clubId);

    // Set up event listeners
    const cleanup = onClubUpdate((data) => {
      if (data.type === 'timeline_event') {
        setEvents(prev => [data.event, ...prev].slice(0, 50)); // Keep last 50 events
      }
    });

    return () => {
      cleanup?.();
    };
  }, [clubId]);

  const getEventMessage = (event: TimelineEvent) => {
    const userDisplay = event.userName || event.userEmail;
    
    switch (event.type) {
      case 'MEMBER_JOINED':
        return `${userDisplay} joined the club`;
      case 'MEMBER_LEFT':
        return `${userDisplay} left the club`;
      case 'CHALLENGE_CREATED':
        return `${userDisplay} created a ${event.metadata?.type} challenge`;
      case 'CHALLENGE_COMPLETED':
        return `${userDisplay} completed a challenge`;
      default:
        return 'Unknown event';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                    <span className="text-white text-sm">
                      {event.userName?.[0]?.toUpperCase() || event.userEmail[0]?.toUpperCase()}
                    </span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">{getEventMessage(event)}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={new Date(event.timestamp).toISOString()}>
                      {new Date(event.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 