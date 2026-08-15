import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserPreferences } from '../types/user';
import { mockUser, defaultPreferences } from '../data/mockUser';
import { storage } from '../lib/storage';

interface UserContextType {
  user: UserProfile;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => storage.get('user_profile', mockUser));
  const [preferences, setPreferences] = useState<UserPreferences>(() => 
    storage.get('user_preferences', defaultPreferences)
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    storage.get('is_authenticated', true)
  );

  const login = (email: string, name?: string) => {
    const updatedUser = {
      ...user,
      email,
      name: name || user.name,
    };
    setUser(updatedUser);
    setIsAuthenticated(true);
    storage.set('user_profile', updatedUser);
    storage.set('is_authenticated', true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    storage.set('is_authenticated', false);
  };

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      storage.set('user_preferences', updated);
      return updated;
    });
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...newProfile };
      storage.set('user_profile', updated);
      return updated;
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        preferences,
        isAuthenticated,
        login,
        logout,
        updatePreferences,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
