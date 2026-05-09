import Icon from './Icon.jsx';
import './Fab.css';

export default function Fab({ onClick, label = 'Add task' }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={label}>
      <Icon name="add" size={28} />
    </button>
  );
}
