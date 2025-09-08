import { useUser } from '@clerk/clerk-expo';

export const useRole = () => {
  const { user } = useUser();

  const isAdmin = () => {
    if (!user?.publicMetadata) return false;
    const roles = user.publicMetadata.roles as string[] | undefined;
    return roles?.includes('admin') || false;
  };

  const isUser = () => {
    if (!user?.publicMetadata) return true; // Par défaut user
    const roles = user.publicMetadata.roles as string[] | undefined;
    return roles?.includes('user') || true;
  };

  return {
    isAdmin: isAdmin(),
    isUser: isUser(),
    roles: user?.publicMetadata?.roles as string[] | undefined,
  };
};
