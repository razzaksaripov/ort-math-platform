import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const AdminPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Состояние для процесса сохранения в БД
  const [questions, setQuestions] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/parse-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Ошибка при распознавании');

      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось распознать картинку. Проверь консоль бэкенда.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // --- НОВАЯ ФУНКЦИЯ ДЛЯ СОХРАНЕНИЯ В БАЗУ ---
  const handleSaveToDB = async () => {
    if (questions.length === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/save-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questions),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при сохранении');
      }

      const result = await response.json();
      alert(`✅ Успех: ${result.message}`);
      setQuestions([]); // Очищаем список после успешного сохранения
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('❌ Не удалось сохранить в БД: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🛠 ИИ-Парсер Задач</h1>
        <p className="text-gray-600">Загрузи скриншот с тестом, и нейросеть автоматически переведет его в базу данных.</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        } ${questions.length > 0 ? 'py-6' : 'py-20'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="text-xl font-medium text-blue-600 animate-pulse">
            🤖 ИИ решает задачи... (около 10 секунд)
          </div>
        ) : (
          <div className="text-gray-600 text-lg">
            {isDragActive ? 'Бросай сюда! 📥' : 'Перетащи сюда скриншот или кликни для выбора'}
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Распознано вопросов: {questions.length}
            </h2>
            <button 
              className={`text-white px-6 py-2 rounded-lg font-medium transition-colors ${
                isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={handleSaveToDB} // ТЕПЕРЬ ТУТ РЕАЛЬНАЯ ФУНКЦИЯ
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить все в базу'}
            </button>
          </div>

          <div className="grid gap-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                      Topic ID: {q.topic_id}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Ответ: {q.correct_answer}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">Тип: {q.question_type}</span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Текст вопроса (LaTeX):</p>
                  <p className="text-gray-800 font-mono text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                    {q.content_latex}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">Объяснение ИИ:</p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded">
                    {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;