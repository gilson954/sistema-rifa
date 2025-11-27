import { useState } from 'react';
import { motion, easeOut } from 'framer-motion';
import { QrCode } from 'lucide-react';

type Props = { className?: string; variant?: 'icon' | 'logo' };

export default function PixLogo({ className, variant = 'logo' }: Props) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (variant === 'icon') {
    return (
      <motion.span
        aria-label="PIX"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: easeOut } }}
      >
        <QrCode className={className || 'h-5 w-5'} />
      </motion.span>
    );
  }
  const candidates = [
    `${import.meta.env.BASE_URL || '/'}pix-logo.png`,
    `${import.meta.env.BASE_URL || '/'}logo-chatgpt.png`,
    `${import.meta.env.BASE_URL || '/'}pix-logo.svg`
  ];
  const src = candidates[index];
  const handleError = () => {
    if (index < candidates.length - 1) setIndex(index + 1);
    else setFailed(true);
  };
  if (failed || !src) {
    return (
      <motion.span
        className={className || 'inline-block h-5 w-5 rounded-md bg-teal-400'}
        aria-label="PIX"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: easeOut } }}
      />
    );
  }
  return (
    <motion.img
      src={src}
      alt="PIX"
      className={className || 'h-5 w-5'}
      onError={handleError}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: easeOut } }}
    />
  );
}
