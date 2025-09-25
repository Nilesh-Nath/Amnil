import axios from 'axios';
import React from 'react'
import { useContext } from 'react';
import { useState } from 'react'
import { ToastContainer ,toast } from 'react-toastify'
import { AuthContext } from './AuthContext';

const Income = () => {
    const { accessToken } = useContext(AuthContext)

    const [userData,setUserData] = useState({
        income : ''
    });

    const handleChange = (e)=>{
        const { name, value } = e.target;

        if(e.target.name == 'income' && e.target.value < 0){
            console.log('Income cant be less than 0');
        }

        setUserData(prev=>({
            ...prev,
            [name] : value
        }))
    }

    const handleSubmit = async (e)=>{
        e.preventDefault();
        try{
            const response = await axios.post('http://localhost:5000/api/expenses/income',{
                userData}
            ,{withCredentials:true , headers : { 'Authorization' : `Bearer ${accessToken}` }})

            setUserData({
                income : ''
            })
        }catch(err){
            console.log(`Error : ${err}`);
            toast.error(err.response.data.msg)
        }
    }

  return (
    <>
        <div className='flex justify-center items-center mt-10'>
            <form onSubmit={handleSubmit} className='p-4 w-96 h-60 m-auto flex flex-col justify-evenly bg-[#2f2f2f] text-white rounded-xl'>
                
                <h2 className="text-2xl font-semibold mb-6 text-center">Add this weeks Income</h2>
               
                <div>
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