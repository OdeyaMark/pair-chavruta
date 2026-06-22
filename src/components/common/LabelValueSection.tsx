import React, { memo } from 'react';
import { EditableLabelValue } from './EditableLabelValue';
import type { LabelValuePair } from '../../types';

interface LabelValueSectionProps {
  title: string;
  items: LabelValuePair[];
  icon: React.ReactNode;
  isEditMode?: boolean;
  onItemChange?: (index: number, value: string) => void;
}

export const LabelValueSection = memo<LabelValueSectionProps>(({ title, items, icon, isEditMode, onItemChange }) => (
  <div className="card-section">
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <h3 className="section-title">{title}</h3>
    </div>
    <div className="label-value-grid">
      {items.map((item, index) => (
        isEditMode && onItemChange ? (
          <EditableLabelValue
            key={index}
            item={item}
            onChange={(value) => onItemChange(index, value)}
          />
        ) : (
          <div key={index} className="label-value-item">
            <span className="item-label">{item.label}:</span>
            <span className="item-value">{item.value}</span>
          </div>
        )
      ))}
    </div>
  </div>
));