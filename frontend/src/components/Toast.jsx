const Toast = ({ toast, setToast }) => {
  if (!toast.visible) return null;

  return (
    <div className="toast-container">
      <div className="toast toast-error">
        <div className="toast-content">{toast.message}</div>
        <button 
          className="toast-close" 
          onClick={() => setToast({ visible: false, message: '' })}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
