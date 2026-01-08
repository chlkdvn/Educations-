import React from 'react';
import { assets, dummyTestimonial } from '../../assets/assets';

const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="border border-gray-500/30 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 overflow-hidden w-full max-w-[280px] mx-auto">
      <div className="p-3 bg-gray-500/10">
        <div className="flex items-center gap-3">
          <img
            className="h-10 w-10 rounded-full"
            src={testimonial.image}
            alt={testimonial.name}
          />
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {testimonial.name}
            </h3>
            <p className="text-gray-800/80 text-xs">{testimonial.role}</p>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <img
              key={i}
              className="h-3 w-3"
              src={i < Math.floor(testimonial.rating) ? assets.star : assets.star_blank}
              alt="star"
            />
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-2 line-clamp-3">
          {testimonial.feedback}
        </p>
        <a href="#" className="text-blue-500 underline text-xs mt-2 inline-block">
          Read more
        </a>
      </div>
    </div>
  );
};

const TestimonialSection = () => {
  return (
    <div className="py-8 px-4 sm:px-6 md:px-8">
      <h2 className="text-2xl font-medium text-gray-800 text-center">Testimonials</h2>
      <p className="text-sm text-gray-500 mt-2 text-center">
        Hear from our learners as they share their journeys of transformation,
        success, and how our platform has made a difference in their lives.
      </p>
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {dummyTestimonial.map((testimonial, index) => (
          <TestimonialCard key={index} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
};

export default TestimonialSection;