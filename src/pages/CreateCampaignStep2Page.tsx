import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Gift, Trophy, Settings, Image as ImageIcon, FileText, Check } from 'lucide-react'; // Adicionado 'Check'
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion'; // Adicionado framer-motion
import { useCampaignWithRefetch } from '../hooks/useCampaigns';
import { CampaignAPI } from '../lib/api/campaigns';
import { ImageUpload } from '../components/ImageUpload';
import { useImageUpload } from '../hooks/useImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import DateTimePickerModal from '../components/DateTimePickerModal';
import { Promotion, Prize } from '../types/promotion';
import 'react-datepicker/dist/react-datepicker.css';

// Novo componente de Checkbox Animado
interface AnimatedCheckboxProps {
  id: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  color: 'blue' | 'green';
}

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30
};

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({ id, name, checked, onChange, label, color }) => {
  const baseClasses = `p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm`;
  
  const colorConfig = {
    blue: {
      base: 'border-blue-100/20 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 hover:border-blue-300/50 dark:hover:border-blue-700/50',
      checked: 'border-blue-600/50 dark:border-blue-500/50 bg-blue-500/20 dark:bg-blue-900/40 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5',
      checkboxColor: 'rgb(37, 99, 235)', // blue-600
    },
    green: {
      base: 'border-green-100/20 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10 hover:border-green-300/50 dark:hover:border-green-700/50',
      checked: 'border-green-600/50 dark:border-green-500/50 bg-green-500/20 dark:bg-green-900/40 shadow-xl shadow-green-500/10 dark:shadow-green-500/5',
      checkboxColor: 'rgb(16, 185, 129)', // green-600
    }
  };

  const config = colorConfig[color];

  return (
    <label 
      htmlFor={id} 
      className={`${baseClasses} ${checked ? config.checked : config.base}`}
    >
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-medium select-none">
        {label}
      </span>
      
      {/* Input de checkbox real, mas escondido */}
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      {/* Visualização Animada do Checkbox */}
      <motion.div
        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-colors duration-200`}
        animate={{
          backgroundColor: checked ? config.checkboxColor : 'rgb(255, 255, 255)',
          borderColor: checked ? 'transparent' : 'rgb(209, 213, 219)',
          boxShadow: checked ? '0 0 0 3px ' + (color === 'blue' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(16, 185, 129, 0.3)') : 'none',
        }}
        transition={spring}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring}
          >
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>
    </label>
  );
};

const CreateCampaignStep2Page = () => {
// ... todo o restante do código da página CreateCampaignStep2Page ...

// A seção de Checkboxes (linha 612 do arquivo original) foi substituída por:
// ...
              {/* Checkboxes Section */}
              <div className="space-y-3 pt-4 border-t-2 border-gray-200/20 dark:border-gray-700/30">
                <AnimatedCheckbox
                  id="showRanking"
                  name="showRanking"
                  checked={formData.showRanking}
                  onChange={handleInputChange}
                  label="Mostrar ranking de compradores"
                  color="blue"
                />

                <AnimatedCheckbox
                  id="showPercentage"
                  name="showPercentage"
                  checked={formData.showPercentage}
                  onChange={handleInputChange}
                  label="Mostrar porcentagem de vendas"
                  color="green"
                />
              </div>
            </div>
          </div>
// ...