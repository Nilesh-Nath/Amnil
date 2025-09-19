import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import facebook from '../assets/facebook.svg'
import google from '../assets/google.svg'
import eye from '../assets/eye.svg'
import eyes from '../assets/eye-slash.svg'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

const Login = () => {
    const [ showPwd , setShowPwd ] = useState(false);
    const [ formData , setFormData ] = useState({
        username : '',
        password : ''
    })

    const [error , setError] = useState({
        username : '',
        password : ''
    })

    const navigate = useNavigate()
    const { setAccessToken ,setUser } = useContext(AuthContext)

    const handleChange = (e)=>{
        setFormData((prev)=>({
            ...prev,
            [e.target.name] : e.target.value
        }))
    }

    const handleSubmit = async (e)=>{
        e.preventDefault();
        const newError = {}

        if(formData.username == ''){
            newError.username = 'Please enter username.'
        }

        if(formData.password == ''){
            newError.password = 'Please enter password.'
        }

        if(Object.keys(newError).length > 0){
            setError(newError)
            return;
        }

        try{
            const response = await axios.post("http://localhost:5000/login",{
                formData
            },{withCredentials:true})
            setAccessToken(response.data.accessToken)
            setUser(response.data.user.username)
            toast.success(response.data.msg)
            toast.success('Redirecting to dashboard...')
            setTimeout(()=>{
                navigate("/", {replace:true})
            },2000)
        }catch(err){
            toast.error(err.response.data.msg)
        }

    }

  return (
    <div className='flex h-screen justify-center items-center'>
        <ToastContainer />
        <div className='flex flex-col items-center justify-center h-full w-1/2 gap-5'>
            <h2 className='text-4xl font-bold'>Log In to ET</h2>
            <div className='flex gap-10'>
                <img src={facebook} alt="Facebook logo" className="w-10 h-10" />

                <img src={google} alt="Google logo" className="w-10 h-10" />
            </div>
            <div className='flex justify-center w-full items-center gap-2'>
                <div className='border w-1/4 h-0 border-gray-300'></div>  
                <span className='text-white'>or do via email</span>
                <div className='border w-1/4 h-0 border-gray-300'></div>
            </div>
            <form onSubmit={handleSubmit} className='flex flex-col gap-5 items-end mb-5 w-2/5'>
                <input onChange={handleChange} name='username' className='p-5 outline-none rounded-4xl bg-[#2f2f2f] w-full' type='text' placeholder='Your username' />
                {error && <span className='text-sm text-red-600 w-full'>{error.username}</span>}
                <div className='p-5 flex outline-none rounded-4xl bg-[#2f2f2f] w-full cursor-pointer'>
                    <input onChange={handleChange}  name='password' className='w-full outline-none'  type={`${showPwd ? 'text' : 'password'}`} placeholder='Your password' />
                    <img src={showPwd ? eyes : eye} aly="eye" className='w-6' onClick={()=>{setShowPwd(!showPwd)}} />
                </div>
                {error && <span className='text-sm text-red-600 w-full'>{error.password}</span>}
                <span><Link className='text-sm underline hover:text-gray-400 duration-200' to='/forget-password'>Forget password ?</Link></span>
                <button className='bg-blue-700 text-white p-4 rounded-4xl w-1/2 cursor-pointer'>Log In</button>
            </form>
            <span>Don't have an account? <Link className='text-blue-500' to="/Signup">Register</Link></span>
        </div>
      </div>
  )
}

export default Login