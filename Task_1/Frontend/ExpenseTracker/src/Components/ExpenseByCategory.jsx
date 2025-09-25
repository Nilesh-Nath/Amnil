import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Pie } from 'react-chartjs-2';
import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../Pages/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const ExpenseByCategory = () => {

    const [labels,setLabels] = useState([]);
    const [expenses,setExpenses] = useState([]);
    const { accessToken } = useContext(AuthContext);
    
    useEffect(()=>{
        fetchData()
    },[])

    const fetchData = async ()=>{
        try{
            const response = await axios.get('http://localhost:5000/api/expenses/by-category',{withCredentials:true,headers : {'Authorization' : `Bearer ${accessToken}`}})
            const data = response.data.data;

            const categories = data.map(item=>item.category)
            const expense = data.map(item=>Number(item.sum))

            setLabels(categories);
            setExpenses(expense);

        }catch(err){
            console.log(`Data fetch Error : ${err}`);
        }
    }

    const data = {
        labels: labels,
        datasets: [
        {
            label: 'Expenses',
            data: expenses,
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56',
                '#4BC0C0', '#9966FF', '#FF9F40',
                '#8BC34A'
            ],
            hoverOffset: 4,
        },
        ],
    };

     const options = {
        responsive: true,
        plugins: {
            legend: {
            labels: {
                color: 'white',
            },
            },
            tooltip: {
            titleColor: 'white',
            bodyColor: 'white',
            backgroundColor: '#333',
            },
        },
    };


  return <div className='mt-16 w-full' style={{ width: '700px', height: '700px' }}><Pie data={data} options={options}  /></div>
}

export default ExpenseByCategory
