import { useState, useEffect } from 'react';
import { motion, AnimatePresence, easeOut } from 'framer-motion';
import { X, Save, Pencil, Plus, User } from 'lucide-react';
import { formatPixKey, isValidPixKey, PixKeyType } from '../../utils/pixValidation';

type PixKeyModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (payload: { key_type: PixKeyType; key_value: string; holder_name: string }) => Promise<void> | void;
  title: string;
  initial?: { key_type: PixKeyType; key_value: string; holder_name: string } | null;
  saving?: boolean;
};

export default function PixKeyModal({ show, onClose, onSave, title, initial, saving }: PixKeyModalProps) {
  const [keyType, setKeyType] = useState<PixKeyType>(initial?.key_type || 'telefone');
  const [keyValue, setKeyValue] = useState<string>(initial?.key_value || '');
  const [holderName, setHolderName] = useState<string>(initial?.holder_name || '');

  useEffect(() => {
    if (initial) {
      setKeyType(initial.key_type);
      setKeyValue(initial.key_value);
      setHolderName(initial.holder_name);
    }
  }, [initial]);

  const options: { label: string; value: PixKeyType }[] = [
    { label: 'Telefone', value: 'telefone' },
    { label: 'CPF', value: 'cpf' },
    { label: 'CNPJ', value: 'cnpj' },
    { label: 'E-mail', value: 'email' },
    { label: 'Aleatória', value: 'aleatoria' }
  ];

  const overlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  const content = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
    exit: { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2, ease: easeOut } }
  };

  const handleSave = () => {
    const valid = isValidPixKey(keyType, keyValue);
    if (!valid || !holderName.trim()) return;
    onSave({ key_type: keyType, key_value: keyValue, holder_name: holderName.trim() });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" variants={overlay} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
          <motion.div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md border border-gray-200/20 dark:border-gray-700/20 shadow-2xl" variants={content} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
              <motion.button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose}>
                <X className="h-5 w-5 text-gray-400" />
              </motion.button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Tipo da chave</label>
                <div className="relative">
                  <select value={keyType} onChange={(e) => setKeyType(e.target.value as PixKeyType)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-xs sm:text-sm">
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-2.5 h-4 w-4 rounded-sm bg-gray-300 dark:bg-gray-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Chave</label>
                <input
                  type="text"
                  value={keyType === 'aleatoria' || keyType === 'email' ? keyValue : formatPixKey(keyType, keyValue)}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={keyType === 'telefone' ? '(11) 98888-7777' : keyType === 'cpf' ? '000.000.000-00' : keyType === 'cnpj' ? '00.000.000/0000-00' : keyType === 'email' ? 'email@dominio.com' : 'Chave aleatória'}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-xs sm:text-sm"
                />
                {!isValidPixKey(keyType, keyValue) && keyValue.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">Chave inválida para o tipo selecionado</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Nome do titular</label>
                <div className="relative">
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-xs sm:text-sm"
                  />
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <motion.button
                onClick={handleSave}
                disabled={saving || !holderName.trim() || !isValidPixKey(keyType, keyValue)}
                className="flex-1 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-md disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Save className="h-4 w-4 inline mr-2" /> Salvar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
