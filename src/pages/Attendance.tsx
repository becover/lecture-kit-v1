import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  status: 'present' | 'absent' | 'late' | 'pending';
}

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: '김철수', status: 'pending' },
    { id: 2, name: '이영희', status: 'pending' },
    { id: 3, name: '박민수', status: 'pending' },
    { id: 4, name: '정지현', status: 'pending' },
    { id: 5, name: '최동욱', status: 'pending' },
  ]);

  const [newStudentName, setNewStudentName] = useState('');

  const updateStatus = (id: number, status: Student['status']) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const addStudent = () => {
    if (newStudentName.trim()) {
      const newId = Math.max(...students.map(s => s.id), 0) + 1;
      setStudents([...students, { id: newId, name: newStudentName, status: 'pending' }]);
      setNewStudentName('');
    }
  };

  const removeStudent = (id: number) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const resetAll = () => {
    setStudents(students.map(s => ({ ...s, status: 'pending' })));
  };

  const stats = {
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    pending: students.filter(s => s.status === 'pending').length,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">출석 체크</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-gray-600">출석</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">지각</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <p className="text-sm text-gray-600">결석</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
            <p className="text-sm text-gray-600">미확인</p>
            <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStudent()}
            placeholder="학생 이름 추가"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addStudent}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            추가
          </button>
          <button
            onClick={resetAll}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            초기화
          </button>
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                student.status === 'present'
                  ? 'bg-green-50 border-green-200'
                  : student.status === 'late'
                  ? 'bg-yellow-50 border-yellow-200'
                  : student.status === 'absent'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-800">{student.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(student.id, 'present')}
                    className={`px-4 py-1 rounded ${
                      student.status === 'present'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    } transition-colors`}
                  >
                    출석
                  </button>
                  <button
                    onClick={() => updateStatus(student.id, 'late')}
                    className={`px-4 py-1 rounded ${
                      student.status === 'late'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                    } transition-colors`}
                  >
                    지각
                  </button>
                  <button
                    onClick={() => updateStatus(student.id, 'absent')}
                    className={`px-4 py-1 rounded ${
                      student.status === 'absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                    } transition-colors`}
                  >
                    결석
                  </button>
                  <button
                    onClick={() => removeStudent(student.id)}
                    className="px-3 py-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
