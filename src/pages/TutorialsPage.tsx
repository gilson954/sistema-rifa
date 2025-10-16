import { motion } from 'framer-motion';
import { BookOpen, Video, FileText } from 'lucide-react';

export default function TutorialsPage() {
  const tutorials = [
    {
      title: 'Como criar sua primeira campanha',
      type: 'Vídeo',
      icon: Video,
      duration: '5 min'
    },
    {
      title: 'Configurando pagamentos',
      type: 'Artigo',
      icon: FileText,
      duration: '3 min'
    },
    {
      title: 'Gerenciando participantes',
      type: 'Vídeo',
      icon: Video,
      duration: '7 min'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tutoriais</h1>
        <p className="text-gray-600 mt-1">Aprenda a usar a plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial, index) => {
          const Icon = tutorial.icon;
          return (
            <motion.div
              key={tutorial.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Icon className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tutorial.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="px-3 py-1 bg-gray-100 rounded-full">
                  {tutorial.type}
                </span>
                <span>{tutorial.duration}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center"
      >
        <BookOpen className="mx-auto text-blue-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Precisa de ajuda?
        </h2>
        <p className="text-gray-600 mb-6">
          Entre em contato com nosso suporte para tirar suas dúvidas
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all">
          Falar com Suporte
        </button>
      </motion.div>
    </div>
  );
}
