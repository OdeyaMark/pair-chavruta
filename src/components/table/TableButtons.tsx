import React from 'react';
import { Trash2, X, Check } from 'lucide-react';

export const ActivateButton: React.FC = () => (
  <div className="button-with-title">
    <Check size={18} className="icon-success" />
    <span className="button-title">Activate</span>
  </div>
);

export const DiscardButton: React.FC = () => (
  <div className="button-with-title discard">
    <X size={18} className="icon-danger" />
    <span className="button-title">Discard</span>
  </div>
);

export const DeleteButton: React.FC = () => (
  <div className="button-with-title delete">
    <Trash2 size={18} className="icon-danger" />
  </div>
);
