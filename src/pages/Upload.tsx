import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  category: string;
}

export default function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: 1,
      name: '강의자료_1주차.pdf',
      size: '2.5 MB',
      type: 'PDF',
      uploadedAt: '2024-01-15',
      category: '강의자료',
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dragActive, setDragActive] = useState(false);

  const categories = ['강의자료', '과제', '참고자료', '기타'];

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    const newFiles: UploadedFile[] = Array.from(uploadedFiles).map((file, index) => ({
      id: files.length + index + 1,
      name: file.name,
      size: formatFileSize(file.size),
      type: getFileType(file.name),
      uploadedAt: new Date().toISOString().split('T')[0],
      category: '기타',
    }));

    setFiles([...newFiles, ...files]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  const deleteFile = (id: number) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const updateCategory = (id: number, category: string) => {
    setFiles(files.map(file =>
      file.id === id ? { ...file, category } : file
    ));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const filteredFiles = selectedCategory === 'all'
    ? files
    : files.filter(file => file.category === selectedCategory);

  const getFileIcon = (type: string) => {
    if (type === 'PDF') return '📄';
    if (['JPG', 'PNG', 'GIF', 'JPEG'].includes(type)) return '🖼️';
    if (['DOC', 'DOCX'].includes(type)) return '📝';
    if (['XLS', 'XLSX'].includes(type)) return '📊';
    if (['ZIP', 'RAR'].includes(type)) return '📦';
    if (['MP4', 'AVI', 'MOV'].includes(type)) return '🎥';
    return '📎';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">강의 자료 관리 📁</h1>

        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <span className="text-6xl">📤</span>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PDF, 이미지, 문서 등 모든 파일 형식 지원
          </p>
          <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors font-medium">
            파일 선택
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <p className="text-gray-600">
            총 <strong>{filteredFiles.length}</strong>개 파일
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{getFileIcon(file.type)}</span>
                <div>
                  <h3 className="font-medium text-gray-800 break-all">{file.name}</h3>
                  <p className="text-sm text-gray-500">{file.size}</p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <select
                value={file.category}
                onChange={(e) => updateCategory(file.id, e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{file.uploadedAt}</span>
              <span className="px-2 py-1 bg-gray-100 rounded">{file.type}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert(`다운로드: ${file.name}\n\n실제 환경에서는 파일을 다운로드합니다.`)}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                다운로드
              </button>
              <button
                onClick={() => deleteFile(file.id)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">업로드된 파일이 없습니다</p>
            <p className="text-gray-400 mt-2">위의 업로드 영역을 사용하여 파일을 추가하세요</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>안내:</strong> 이 데모에서는 파일이 브라우저 메모리에만 저장됩니다.
          실제 환경에서는 서버에 파일을 업로드하고 저장해야 합니다.
        </p>
      </div>
    </div>
  );
}
