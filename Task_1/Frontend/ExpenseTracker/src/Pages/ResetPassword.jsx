import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import axios from 'axios'

const ResetPassword = () => {
    const { token } = useParams()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!password || !confirmPassword) {
            toast.error("Please fill out both fields.")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.")
            return
        }

        // if (password.length < 6) {
        //     toast.error("Password must be at least 6 characters.")
        //     return
        // }

        try {
            const res = await axios.post(`http://localhost:5000/reset-password/${token}`, {
                password,
            }, { withCredentials: true })

            toast.success(res.data.message || "Password reset successful!")

            setTimeout(() => {
                navigate('/login',{replace:true})
            }, 1000);

        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong.")
        }
    }

    return (
        <div className='flex h-screen justify-center items-center'>
            <ToastContainer />
            <div className='flex flex-col items-center bg-[#1f1f1f] p-10 rounded-lg shadow-lg w-[400px] text-center'>
                <h2 className='text-2xl font-bold mb-4 text-white'>Reset Your Password</h2>
                <p className='text-gray-400 text-sm mb-6'>
                    Please enter your new password. Make sure it's strong and secure.
                </p>
                <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4'>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='p-4 rounded-4xl bg-[#2f2f2f] text-white outline-none w-full'
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className='p-4 rounded-4xl bg-[#2f2f2f] text-white outline-none w-full'
                    />
                    <button type="submit" className='bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-4xl w-full transition-all cursor-pointer'>
                        Reset Password
                    </button>
                </form>
                <Link to="/login" className='mt-4 text-sm text-blue-400 underline hover:text-blue-500'>
                    Back to Log in
                </Link>
            </div>
        </div>
    )
}

export default ResetPassword
