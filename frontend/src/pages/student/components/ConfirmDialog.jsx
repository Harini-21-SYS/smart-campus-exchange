function ConfirmDialog({ title, message, onCancel, onConfirm, confirmLabel = "Confirm" }) {
  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="dash-modal-desc">{message}</p>
        <div className="confirm-btn-row">
          <button className="dash-btn dash-btn-outline" onClick={onCancel}>Cancel</button>
          <button className="dash-btn dash-btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;