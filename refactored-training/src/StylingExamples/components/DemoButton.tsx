import React from 'react';
import styles from '../StylingExamples.module.css';

type DemoButtonVariant = 'primary' | 'ghost' | 'warning';

type DemoButtonProps = {
  variant?: DemoButtonVariant;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

const variantClassMap: Record<DemoButtonVariant, string> = {
  primary: styles.primaryButton,
  ghost: styles.ghostButton,
  warning: styles.warningButton,
};

const DemoButton: React.FC<DemoButtonProps> = ({
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  children,
}) => {
  return (
    <button
      type={type}
      className={variantClassMap[variant]}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default DemoButton;
