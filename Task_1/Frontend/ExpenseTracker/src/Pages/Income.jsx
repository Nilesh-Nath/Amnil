import axios from 'axios';
import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ToastContainer ,toast } from 'react-toastify'

const Income = () => {
    const navigate = useNavigate()

    const [userData,setUserData] = useState({
        username : '',
        income : ''
    });

    const handleChange = (e)=>{
        const { name, value } = e.target;
        setUserData(prev=>({
            ...prev,
            [name] : value
        }))
    }

    const handleSubmit = async (e)=>{
        e.preventDefault();
        try{
            const response = await axios.post('http://localhost:5000/income',{
                userData
            },{withCredentials:true})

            if(response.data.success){
                navigate('/Dashboard')
            }
        }catch(err){
            console.log(`Error : ${err}`);
            toast.error(err.response.data.msg)
        }
    }

  return (
    <>
        <div className='flex justify-center items-center h-screen'>
            <form onSubmit={handleSubmit} className='p-4 w-96 h-96 m-auto flex flex-col justify-evenly bg-[#2f2f2f] text-white rounded-xl'>
                <h2 className='text-2xl font-bold underline'>ExpenseTracker</h2>
                <div>
                    <label className='text-xl font-semibold mb-2'>
                        Enter Username
                    </label>
                    <input name='username' type='text' placeholder='Enter your username' 
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" value={userData.username} onChange={handleChange} />
                </div>

                <div>
                    <label className='text-xl font-semibold'>
                        Enter Weekly Income
                    </label>
                    <input name='income' type='number' placeholder='Enter your Weekly Income' 
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" value={userData.income} onChange={handleChange}  />
                </div>

                <button className='p-2 rounded-md bg-green-500 hover:bg-green-800 text-white cursor-pointer'>Save & Continue</button>
            </form>
        </div>
        <ToastContainer />
    </>
  )
}

export default Income