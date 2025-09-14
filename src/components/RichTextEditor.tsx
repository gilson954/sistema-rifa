// RichTextEditor.tsx
import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite a descrição da sua campanha...",
  className = "",
  error
}) => {
  const quillRef = useRef<ReactQuill | null>(null);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link'],
      [{ color: [] }, { background: [] }],
      ['clean']
    ],
    clipboard: {
      // ajuda a colar mantendo menos formatação problemática
      matchVisual: false
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link',
    'color', 'background'
  ];

  // Handle keydown to avoid form submit and control Enter / Shift+Enter behavior
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      const range = editor.getSelection();
      // se não houver seleção, não mexe
      if (!range) {
        // prevenindo envio de form enquanto o editor estiver ativo
        e.preventDefault();
        return;
      }

      // prevenimos o comportamento padrão do navegador (submeter form)
      e.preventDefault();

      // Shift+Enter => quebra de linha (line break)
      if (e.shiftKey) {
        editor.insertText(range.index, '\n', 'user');
        editor.setSelection(range.index + 1, 0);
      } else {
        // Enter normal => nova linha / novo parágrafo (garantido)
        // Inserimos um '\n' (Quill interpretará corretamente)
        editor.insertText(range.index, '\n', 'user');
        editor.setSelection(range.index + 1, 0);
      }
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        className={`bg-white dark:bg-gray-800 rounded-lg ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <style jsx global>{`
        .rich-text-editor .ql-editor { min-height: 200px; font-family: inherit; color: rgb(17 24 39); }
        .dark .rich-text-editor .ql-editor { color: rgb(243 244 246); background-color: rgb(31 41 55); }
        .rich-text-editor .ql-toolbar { border-top: 1px solid rgb(209 213 219); border-left: 1px solid rgb(209 213 219); border-right: 1px solid rgb(209 213 219); border-bottom: none; border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; background-color: rgb(249 250 251); }
        .dark .rich-text-editor .ql-toolbar { border-color: rgb(75 85 99); background-color: rgb(55 65 81); }
        .rich-text-editor .ql-container { border-bottom: 1px solid rgb(209 213 219); border-left: 1px solid rgb(209 213 219); border-right: 1px solid rgb(209 213 219); border-top: none; border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
        .dark .rich-text-editor .ql-container { border-color: rgb(75 85 99); }
        .rich-text-editor .ql-toolbar .ql-stroke { stroke: rgb(107 114 128); }
        .dark .rich-text-editor .ql-toolbar .ql-stroke { stroke: rgb(156 163 175); }
        .rich-text-editor .ql-toolbar .ql-fill { fill: rgb(107 114 128); }
        .dark .rich-text-editor .ql-toolbar .ql-fill { fill: rgb(156 163 175); }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke { stroke: rgb(79 70 229); }
        .rich-text-editor .ql-toolbar button:hover .ql-fill { fill: rgb(79 70 229); }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke { stroke: rgb(79 70 229); }
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill { fill: rgb(79 70 229); }
        .rich-text-editor .ql-editor.ql-blank::before { color: rgb(156 163 175); font-style: normal; }
        .dark .rich-text-editor .ql-editor.ql-blank::before { color: rgb(107 114 128); }
        .rich-text-editor .ql-tooltip { background-color: white; border: 1px solid rgb(209 213 219); border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .dark .rich-text-editor .ql-tooltip { background-color: rgb(31 41 55); border-color: rgb(75 85 99); color: rgb(243 244 246); }
        .rich-text-editor .ql-tooltip input { border: 1px solid rgb(209 213 219); border-radius: 0.375rem; padding: 0.5rem; }
        .dark .rich-text-editor .ql-tooltip input { border-color: rgb(75 85 99); background-color: rgb(55 65 81); color: rgb(243 244 246); }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
