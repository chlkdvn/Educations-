import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import CourseCard from './CourseCard'

const CourseSection = () => {
 const{allCourses}=useContext(AppContext)

  return (
    <div className='py-16 md:px-40 px-8'>

 <h2  className='text-3xl font-medium text-gray-800'>
  Learn From the  best 
 </h2>
 <p className='text-sm md:text-base text-gray-500 mt-3'>
  Discover  our top-rated courses across various  categories. From  coding  and design  to <br/> business and  wellness, our  course  are  craft  to deliver  results.
   </p  >

<div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto'>
  {allCourses.slice(0,4).map((course,index)=><CourseCard key={index} course={course}/>)}
</div>
 
   <Link  to={"/course-list"} onClick={()=>window.scrollTo(0,0)} className='text-gray-500 border  border-gray-500/30 px-10 py-3 rounded'>  
 Show   all  courses
   </Link>

    </div>
  )
}

export default CourseSection