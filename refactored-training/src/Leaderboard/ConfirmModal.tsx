import React from 'react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!open) return null;
  return (
    <div className={styles.confirmModalOverlay}>
      <div className={styles.confirmModalBox}>
        <div className={styles.confirmModalText}>{message}</div>
        <div className={styles.confirmModalActions}>
          <button className={styles.confirmButton} onClick={onConfirm}>{confirmText}</button>
          <button className={styles.cancelButton} onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
