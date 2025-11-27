import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence, easeOut } from 'framer-motion';
import { X, Trash2, ArrowRight } from 'lucide-react';

type ConfigField = {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
};

type ConfigModalProps<T extends Record<string, string>> = {
  show: boolean;
  onClose: () => void;
  title: string;
  config: T;
  setConfig: Dispatch<SetStateAction<T>> | ((cfg: Record<string, string>) => void);
  onSave: () => void;
  onDelete: () => void;
  isConfigured: boolean;
  fields: ConfigField[];
  helper?: React.ReactNode;
  deleting?: boolean;
  loading?: boolean;
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2, ease: easeOut } },
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};

function ConfigModal<T extends Record<string, string>>({
  show,
  onClose,
  title,
  config,
  setConfig,
  onSave,
  onDelete,
  isConfigured,
  fields,
  helper,
  deleting,
  loading,
}: ConfigModalProps<T>) {
  useEffect(() => {}, [show, title]);

  const handleOverlayClick = () => {
    onClose();
  };

  const handleCloseClick = () => {
    onClose();
  };

  const handleSaveClick = () => {
    onSave();
  };

  const handleDeleteClick = () => {
    onDelete();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-gray-200/20 dark:border-gray-700/20"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <motion.h2
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.h2>
              <motion.button
                onClick={handleCloseClick}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </motion.button>
            </div>

            <motion.p
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Configure sua integração para receber pagamentos automáticos
            </motion.p>

            <div className="space-y-3 sm:space-y-4">
              {helper && (
                <div className="rounded-lg p-3 border border-purple-200/40 dark:border-purple-800/40 bg-purple-50/60 dark:bg-purple-900/20 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {helper}
                </div>
              )}
              {fields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    {field.label} {field.required && '*'}
                  </label>
              <motion.input
                type={field.type}
                value={config[field.name]}
                onChange={(e) => {
                      (setConfig as Dispatch<SetStateAction<T>>)((prev) => ({ ...prev, [field.name]: e.target.value }));
                }}
                placeholder={field.placeholder}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                whileFocus={{ scale: 1.01 }}
              />
                </motion.div>
              ))}
            </div>

            <motion.div
              className="flex gap-2 sm:gap-3 mt-4 sm:mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {isConfigured && (
                <motion.button
                  onClick={handleDeleteClick}
                  disabled={!!deleting || !!loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {deleting ? (
                    <motion.div
                      className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </motion.button>
              )}

              <motion.button
                onClick={handleSaveClick}
                disabled={!!loading || !!deleting}
                className={`animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md ${
                  isConfigured ? 'flex-1' : 'w-full'
                }`}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {loading ? (
                  <motion.div
                    className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <span>Salvar</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfigModal;
