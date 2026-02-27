import React, { useState, useRef, useEffect } from 'react';
import './ScoreInput.css';

const ScoreInput = ({ 
  value, 
  onChange, 
  onFocus, 
  onKeyPress, 
  className, 
  placeholder, 
  disabled,
  uuid
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const generateScoreOptions = () => {
    const options = [];
    for (let i = 10; i >= 6; i -= 0.25) {
      options.push(i.toFixed(2));
    }
    return options;
  };

  const scoreOptions = generateScoreOptions();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = (e) => {
    setShowDropdown(true);
    if (onFocus) onFocus(e);
  };

  const handleOptionClick = (score) => {
    const event = { target: { value: score } };
    onChange(event);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  return (
    <div className="score-input-container1">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        onFocus={handleInputFocus}
        onKeyPress={onKeyPress}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {showDropdown && !disabled && (
        <div ref={dropdownRef} className="score-dropdown1">
          {scoreOptions.map(score => (
            <div
              key={score}
              className="score-option1"
              onClick={() => handleOptionClick(score)}
            >
              {score}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreInput;