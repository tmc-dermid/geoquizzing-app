import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/SignOutModal.less';

export default function SignOutModal() {
  const { showSignOutModal, setShowSignOutModal } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!showSignOutModal) return null;

  const handleOk = () => {
    setShowSignOutModal(false);

    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <AnimatePresence>
      {showSignOutModal && (
        <motion.div
          className='signout-modal'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className='signout-modal-content'
            initial={{scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h2>Signed Out successfully!</h2>
            <button onClick={handleOk}>OK</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
