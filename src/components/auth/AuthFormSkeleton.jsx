import React from 'react';

const InputSkeleton = ({ className = '' }) => (
  <div className={`w-full h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}></div>
);

const ButtonSkeleton = () => (
  <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
);

const AuthFormSkeleton = () => {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <InputSkeleton />
        <InputSkeleton />
        <div className="flex justify-end">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      <ButtonSkeleton />
      
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative px-4 bg-white dark:bg-gray-900">
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
      
      <div className="text-center mt-6">
        <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
      </div>
    </div>
  );
};

export default AuthFormSkeleton;
