import React from 'react';
import { motion, Variants } from 'framer-motion';

export interface StaggeredTextProps {
  text: string;
  className?: string;
  staggerDuration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'blur';
  splitBy?: 'words' | 'characters';
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  text,
  className = '',
  staggerDuration = 0.035,
  delay = 0.15,
  direction = 'up',
  splitBy = 'characters',
  tag: Tag = 'h1',
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDuration,
        delayChildren: delay,
      },
    },
  };

  const getChildVariants = (): Variants => {
    switch (direction) {
      case 'blur':
        return {
          hidden: { opacity: 0, filter: 'blur(10px)', y: 15 },
          visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
              type: 'spring',
              damping: 18,
              stiffness: 140,
            },
          },
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -25 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: 'spring',
              damping: 18,
              stiffness: 140,
            },
          },
        };
      case 'up':
      default:
        return {
          hidden: { opacity: 0, y: 35, rotateX: 30 },
          visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
              type: 'spring',
              damping: 16,
              stiffness: 120,
            },
          },
        };
    }
  };

  const childVariants = getChildVariants();

  if (splitBy === 'words') {
    const words = text.split(' ');
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`inline-block ${className}`}
        style={{ perspective: 1000 }}
      >
        <Tag className="inline">
          {words.map((word, index) => (
            <span key={index} className="inline-block whitespace-nowrap mr-[0.25em]">
              <motion.span variants={childVariants} className="inline-block">
                {word}
              </motion.span>
            </span>
          ))}
        </Tag>
      </motion.div>
    );
  }

  // Split by characters preserving words
  const words = text.split(' ');
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`inline-block ${className}`}
      style={{ perspective: 1000 }}
    >
      <Tag className="inline">
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.28em]">
            {word.split('').map((char, charIndex) => (
              <motion.span
                key={charIndex}
                variants={childVariants}
                className="inline-block transform-gpu"
              >
                {char}
              </motion.span>
            ))}
          </span>
        ))}
      </Tag>
    </motion.div>
  );
};

export default StaggeredText;
