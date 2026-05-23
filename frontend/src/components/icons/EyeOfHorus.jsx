import React, { forwardRef } from 'react';
import horusEyeImg from '../../assets/horus-eye.png';

const EyeOfHorus = forwardRef(({ size = 24, className = "", ...props }, ref) => {
  return (
    <img 
      ref={ref}
      src={horusEyeImg}
      alt="Wadjet"
      width={size}
      height={size}
      className={`lucide ${className}`}
      style={{ objectFit: 'contain' }}
      {...props}
    />
  );
});

EyeOfHorus.displayName = 'EyeOfHorus';

export default EyeOfHorus;
