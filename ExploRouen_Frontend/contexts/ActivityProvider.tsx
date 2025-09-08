import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import ApiService, { UserStats, BackendActivity } from '@/services/api';

interface ActivityContextType {
  userStats: UserStats;
  activities: BackendActivity[];
  isLoading: boolean;
  isLoadingActivities: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  updateStats: (newStats: Partial<UserStats>) => void;
  markActivityCompleted: (activityId: string) => void;
  markMonumentVisited: (monumentId: string) => void;
  addEasterEgg: (locationId: string) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalActivities: 0,
    activeActivities: 0,
    completedActivities: 0,
    monumentsVisited: 0,
    easterEggs: 0,
    easterLocations: 0,
    todayActivities: 0,
    totalParticipants: 0,
    averageRating: 0,
    recentActivities: []
  });
  const [activities, setActivities] = useState<BackendActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = async () => {
    if (!isSignedIn) {
      // Set default stats for non-authenticated users
      setUserStats({
        totalActivities: 0,
        activeActivities: 0,
        completedActivities: 0,
        monumentsVisited: 0,
        easterEggs: 0,
        easterLocations: 0,
        todayActivities: 3, // Show some activities available today
        totalParticipants: 24,
        averageRating: 4.8,
        recentActivities: []
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (token) {
        const stats = await ApiService.getUserStats(token);
        setUserStats(stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
      // Keep existing stats on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllActivities = async () => {
    setIsLoadingActivities(true);
    setError(null);
    
    try {
      const token = isSignedIn ? (await getToken()) || undefined : undefined;
      const allActivities = await ApiService.getActivities({}, token);
      setActivities(allActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
    fetchAllActivities();
  }, [isSignedIn]);

  const refreshStats = async () => {
    await fetchUserStats();
  };

  const refreshActivities = async () => {
    await fetchAllActivities();
  };

  const updateStats = (newStats: Partial<UserStats>) => {
    setUserStats(prev => ({ ...prev, ...newStats }));
  };

  const markActivityCompleted = (activityId: string) => {
    setUserStats(prev => ({
      ...prev,
      completedActivities: prev.completedActivities + 1,
      activeActivities: Math.max(0, prev.activeActivities - 1),
    }));
  };

  const markMonumentVisited = (monumentId: string) => {
    setUserStats(prev => ({
      ...prev,
      monumentsVisited: prev.monumentsVisited + 1,
    }));
  };

  const addEasterEgg = (locationId: string) => {
    setUserStats(prev => ({
      ...prev,
      easterEggs: prev.easterEggs + 1,
    }));
  };

  return (
    <ActivityContext.Provider value={{
      userStats,
      activities,
      isLoading,
      isLoadingActivities,
      error,
      refreshStats,
      refreshActivities,
      updateStats,
      markActivityCompleted,
      markMonumentVisited,
      addEasterEgg
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
