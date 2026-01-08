import React, { useEffect, useState } from 'react'
import { dummyStudentEnrolled } from '../../assets/assets'
import Loading from '../../components/Loading'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useContext } from 'react'

const StudentEnrolled = () => {
  const [enrolledStudents, setEnrolledStudents ] = useState(null)
   const {getToken, isEducactor, backendUrl, }=useContext(AppContext)

  const fetchEnrolledStudents = async () => {
    // Simulate loading delay if needed
    try{
  const token = await  getToken()

   const { data} = await axios.get(`${backendUrl}/api/educator/enrolled-students`,{headers:{Authorization:`Bearer ${token}`}})
    if(data.success){
      setEnrolledStudents(data.enrolledStudents.reverse())
    }else{
       toast.error(data.message)
    }
    }catch(error){
   toast.error(error.message)
    }
  }

  useEffect(() => {
    if(isEducactor){
    fetchEnrolledStudents()
    }

  }, [isEducactor])

  if (!enrolledStudents) {
    return <Loading />
  }

  return (
    <div>
      <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
        <table className='table-fixed md:table-auto w-full overflow-hidden pd-4'>
          <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
              <th className="px-4 py-3 font-semibold">Student Name</th>
              <th className="px-4 py-3 font-semibold">Course Title</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
            </tr>
          </thead>

          <tbody>
            {enrolledStudents.map((item, index) => (
              <tr key={index} className="border-b border-gray-500/20">
                <td className="px-4 py-3 text-center hidden sm:table-cell">{index + 1}</td>
                <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                  <img 
                    src={item.student.imageUrl} 
                    alt="" 
                    className="w-9 h-9 rounded-full" 
                  />
                  <span className="truncate">{item.student.name}</span>
                </td>
                <td className="px-4 py-3 truncate">{item.courseTitle}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {new Date(item.purchaseDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StudentEnrolled