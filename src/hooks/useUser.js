import { useState, useEffect } from 'react';
import { userApi } from '../api/userApi';

export const useUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  return user;
};