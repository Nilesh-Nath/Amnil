import React from 'react'
import { useContext } from 'react'
import { AuthContext } from './Pages/AuthContext'
import { Navigate } from 'react-router-dom';

function ProtectedRoutes({children}) {
    const { accessToken } = useContext(AuthContext);
    
    if(!accessToken){
        return <Navigate to='/login' replace />
    }

    return children
}

export default ProtectedRoutes
