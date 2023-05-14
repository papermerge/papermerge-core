import { createContext, useContext } from 'react';

import type { UserContextType } from 'types';
import { useCurrentUser } from 'utils';


const UserContext = createContext<UserContextType>({
  isLoading: false,
  user: null,
  isError: false
});


export const UserProvider = ({children}: {children: JSX.Element}) => {
  const { user, isError, isLoading } = useCurrentUser();

  let context_value: UserContextType = {
    user,
    isLoading,
    isError
  };

  return (
    <UserContext.Provider value={context_value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
