import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import axios from 'axios'
import validator from 'validator'

const ForgetPassword = () => {
    const [email, setEmail] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email) {
            toast.error("Please enter your email.")
            return
        }

        if(!validator.isEmail(email)){
            toast.error('Please enter a valid email.')
            return
        }

        try {
            const res = await axios.post("http://localhost:5000/forget-password", {
                email,
            }, { withCredentials: true })

            toast.success(res.data.msg || "Password reset link sent!")

            setTimeout(() => {
                navigate('/login',{replace:true})
            }, 1000);
            
        } catch (err) {
            toast.error(err.response?.data?.msg || "Something went wrong.")
        }
    }

    return (
        <div className='flex h-screen justify-center items-center'>
            <ToastContainer />
            <div className='flex flex-col items-center bg-[#1f1f1f] p-10 rounded-lg shadow-lg w-[400px] text-center'>
                <h2 className='text-2xl font-bold mb-4 text-white'>Enter your email to reset password</h2>
                <p className='text-gray-400 text-sm mb-6'>
                    We will be sending an email to the registered email that you provide. Kindly follow the link on the email to change the password (valid for 15 minutes).
                </p>
                <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4'>
                    <input 
                        type="email" 
                        placeholder="Enter Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className='p-4 rounded-4xl bg-[#2f2f2f] text-white outline-none w-full'
                    />
                    <button type="submit" className='bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-4xl w-full transition-all cursor-pointer'>
                        Submit Email
                    </button>
                </form>
                <Link to="/login" className='mt-4 text-sm text-blue-400 underline hover:text-blue-500'>
                    Go back to Log in
                </Link>
            </div>
        </div>
    )
}

export default ForgetPassword
