import { getCurrentUser } from 'aws-amplify/auth';

export const getAuthenticatedUser = async () => {
  try {
    const user = await getCurrentUser();
    return user;
  } catch {
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
};