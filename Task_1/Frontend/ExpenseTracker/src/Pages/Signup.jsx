import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import facebook from '../assets/facebook.svg'
import google from '../assets/google.svg'
import eye from '../assets/eye.svg'
import eyes from '../assets/eye-slash.svg'
import { ToastContainer , toast } from 'react-toastify'
import axios from "axios"
import validator from 'validator'

const Signup = () => {
    const [ showPwd , setShowPwd ] = useState(false);
    const [ formData , setFormData ] = useState({
        email : '',
        username : '',
        password : '',
        cpassword : ''
    })

    const [ error , setError ] = useState({
        email : '',
        username : '',
        password : '',
        cpassword : ''
    })

    const navigate = useNavigate();

    const handleChange = (e)=>{
        setError({})
        setFormData((prev)=>({
            ...prev,
            [e.target.name] : e.target.value
        }))
    }

    const handleSubmit = async (e)=>{
        e.preventDefault();
        const newErrors = {}

        if(formData.email == ''){
            newErrors.email = 'Please enter email.'
        }

        if(!validator.isEmail(formData.email)){
            newErrors.email = 'Please enter a valid email.'
        }

        if(formData.username == ''){
            newErrors.username= 'Please enter username.'
        }

        if(formData.password == ''){
            newErrors.password = 'Please enter password.'
        }

        if(formData.cpassword == ''){
            newErrors.cpassword = 'Please enter confirm password.'
        }


        if(Object.keys(newErrors).length > 0){
            setError(newErrors)
            return
        }
        

        if(formData.password !== formData.cpassword){
            toast.error('Please same password!')
            return;
        }

        try{
            const response = await axios.post('http://localhost:5000/api/auth/signup',{formData})
            toast.success(`${response.data.msg}`)
            toast.success('Redirecting to login page...')
            setTimeout(()=>{
                navigate("/login")
            },2000)

        }catch(err){
            toast.error(`${err.response.data.msg}`);
        }
    }

  return (
      <div className='flex h-screen justify-center items-center'>
        <ToastContainer />
        <div className='flex flex-col items-center justify-center h-full w-1/2 gap-5'>
            <h2 className='text-4xl font-bold'>Sign up to ET</h2>
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
                <input onChange={handleChange} name='email' className={`p-5 outline-none rounded-4xl bg-[#2f2f2f] w-full `} type='text' placeholder='Your email' />
                {error.email && <span className='text-sm text-red-600 w-full'>{error.email}</span>}

                <input onChange={handleChange} name='username' className={`p-5 outline-none rounded-4xl bg-[#2f2f2f] w-full `} type='text' placeholder='Your username' />
                {error.username && <span className='text-sm text-red-600 w-full'>{error.username}</span>}
                
                <div className={`p-5 flex outline-none rounded-4xl bg-[#2f2f2f] w-full cursor-pointer `}>
                    <input onChange={handleChange} name='password' className='w-full outline-none'  type={`${showPwd ? 'text' : 'password'}`} placeholder='Your password' />
                
                    <img src={showPwd ? eyes : eye} aly="eye" className='w-6' onClick={()=>{setShowPwd(!showPwd)}} />
                </div>
                {error.password && <span className='text-sm text-red-600 w-full'>{error.password}</span>}
                <div className={`p-5 flex outline-none rounded-4xl bg-[#2f2f2f] w-full cursor-pointer `}>
                    <input onChange={handleChange} name='cpassword' className='w-full outline-none'  type={`${showPwd ? 'text' : 'password'}`} placeholder='Confirm password' />
                    <img src={showPwd ? eyes : eye} aly="eye" className='w-6' onClick={()=>{setShowPwd(!showPwd)}} />
                </div>

                {error.cpassword && <span className='text-sm text-red-600 w-full'>{error.cpassword}</span>}
                <button className='bg-blue-700 text-white p-4 rounded-4xl w-1/2 cursor-pointer'>Register</button>
            </form>
            <span>Have an account? <Link className='text-blue-500' to="/login">Log In</Link></span>
        </div>
      </div>
  )
}

export default Signup
