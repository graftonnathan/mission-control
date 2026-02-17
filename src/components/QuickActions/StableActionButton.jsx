import { useRef, useEffect, forwardRef } from 'react';
import { useProjectContext } from './QuickActionsProjectProvider';
import './styles/QuickActions.css';

/**
 * Stable Action Button Component
 * Button with stable event handling and layout to prevent alignment issues
 */

// Spinner icon for recovery state
function SpinnerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="60"
        strokeDashoffset="20"
        className="animate-spin"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

// Warning icon for failed state
function WarningIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  );
}

const StableActionButton = forwardRef(({
  actionId,
  label,
  icon,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}, forwardedRef) => {
  const buttonRef = useRef(null);
  const handlerRef = useRef(onClick);
  const { register, unregister, isRecovering, isFailed, executeAction } = useProjectContext();

  // Keep handler reference fresh without re-attaching listeners
  useEffect(() => {
    handlerRef.current = onClick;
  }, [onClick]);

  // Register action on mount, unregister on unmount
  useEffect(() => {
    register(actionId, {
      label,
      icon: icon?.name || 'default',
      variant
    });

    return () => {
      unregister(actionId);
    };
  }, [actionId, register, unregister, label, variant]);

  // Single event attachment on mount
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Dispatch status event
      window.dispatchEvent(new CustomEvent('action:status', {
        detail: { actionId, status: 'started', timestamp: Date.now() }
      }));

      try {
        if (handlerRef.current) {
          await executeAction(actionId, handlerRef.current);
        }
        window.dispatchEvent(new CustomEvent('action:status', {
          detail: { actionId, status: 'completed', timestamp: Date.now() }
        }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('action:status', {
          detail: { actionId, status: 'failed', error, timestamp: Date.now() }
        }));
      }
    };

    button.addEventListener('click', handleClick);
    return () => button.removeEventListener('click', handleClick);
  }, [actionId, executeAction]);

  // Merge refs
  useEffect(() => {
    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(buttonRef.current);
      } else {
        forwardedRef.current = buttonRef.current;
      }
    }
  }, [forwardedRef]);

  const recovering = isRecovering(actionId);
  const failed = isFailed(actionId);

  const variantClasses = {
    primary: 'quick-action-btn--primary',
    secondary: 'quick-action-btn--secondary',
    danger: 'quick-action-btn--danger',
    success: 'quick-action-btn--success'
  };

  const stateClasses = [
    recovering ? 'is-recovering' : '',
    failed ? 'is-failed' : '',
    disabled ? 'is-disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={buttonRef}
      className={`quick-action-btn ${variantClasses[variant] || ''} ${stateClasses} ${className}`}
      disabled={disabled || recovering || failed}
      data-action-id={actionId}
      data-recovering={recovering}
      data-failed={failed}
      aria-label={label}
      aria-busy={recovering}
      aria-disabled={disabled || failed}
      {...props}
    >
      {recovering ? (
        <SpinnerIcon className="quick-action-btn__icon" />
      ) : failed ? (
        <WarningIcon className="quick-action-btn__icon" />
      ) : (
        icon && <span className="quick-action-btn__icon">{icon}</span>
      )}
      <span className="quick-action-btn__label">{label}</span>
    </button>
  );
});

StableActionButton.displayName = 'StableActionButton';

export default StableActionButton;
export { StableActionButton };
