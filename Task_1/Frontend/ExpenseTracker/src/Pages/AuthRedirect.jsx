import React from 'react'
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthRedirect = () => {
    const navigate = useNavigate();

    useEffect(()=>{
        const userCookie = Cookies.get('UserData');

        if(userCookie){
            navigate('/Dashboard')
        }else{
            navigate('/Income')
        }
    },[navigate])


  return null;
}

export default AuthRedirect
