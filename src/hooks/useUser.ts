// next
import { useSession } from 'next-auth/react';

interface UserProps {
  name: string;
  email: string;
  avatar: string;
  thumb: string;
  role: string;
}

export default function useUser() {
  const { data: session } = useSession();
  if (session) {
    const user = session?.user;
    const provider = session?.provider;
    let thumb = user?.image!;
    
    // Set name based on provider or email
    let userName = user?.name;
    if (!userName) {
      if (provider === 'cognito') {
        const email = user?.email?.split('@');
        userName = email ? email[0] : 'John Doe';
      } else {
        // For other providers, use email username or a default
        const email = user?.email?.split('@');
        userName = email ? email[0] : 'John Doe';
      }
    }

    if (!user?.image) {
      user!.image = '/assets/images/users/avatar-1.png';
      thumb = '/assets/images/users/avatar-thumb-1.png';
    }

    const newUser: UserProps = {
      name: userName,
      email: user!.email!,
      avatar: user?.image!,
      thumb,
      role: 'Admin'
    };

    return newUser;
  }
  return false;
}
