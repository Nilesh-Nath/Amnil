import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const AuthRedirect = ({children}) => {
    const {accessToken} = useContext(AuthContext)

    if(accessToken){
      return  <Navigate to="/" replace />
    }

  return children;
}

export default AuthRedirect
