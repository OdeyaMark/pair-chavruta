import React, { memo } from 'react';
import type { LabelValuePair } from '../types';

interface EditableLabelValueProps {
  item: LabelValuePair;
  onChange: (value: string) => void;
}

export const EditableLabelValue = memo<EditableLabelValueProps>(({ item, onChange }) => (
  <div className="label-value-item">
    <span className="item-label">{item.label}:</span>
    <input
      type="text"
      value={item.value}
      onChange={(e) => onChange(e.target.value)}
      className="editable-value"
    />
  </div>
));