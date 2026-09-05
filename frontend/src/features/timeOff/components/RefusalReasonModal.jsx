import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function RefusalReasonModal({ isOpen, onClose, onConfirm, title = 'Refuse Request', isLoading = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim() || reason.trim().length < 3) {
      setError('A valid reason of at least 3 characters is required.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setReason('');
        setError('');
        onClose();
      }}
      title={title}
      description="Please document the justification for rejecting this request"
      footer={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" isLoading={isLoading} onClick={handleConfirm}>
            Confirm Refusal
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-xs">
        <label className="block text-xs font-medium text-slate-700">
          Refusal Reason <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter reason for refusal (e.g., peak project deadline, overlapping department leaves)..."
          className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {error && (
          <div className="text-[11px] text-rose-600 flex items-center space-x-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
