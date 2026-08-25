import React from 'react';
import { BoxLoader, type BoxLoaderProps } from './BoxLoader';

export const Loader: React.FC<BoxLoaderProps> = (props) => {
  return <BoxLoader {...props} />;
};

export default Loader;
