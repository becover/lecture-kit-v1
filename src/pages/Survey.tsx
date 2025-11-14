import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Option {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  id: number;
  question: string;
  options: Option[];
  isActive: boolean;
}

export default function Survey() {
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 1,
      question: '오늘 수업 내용을 이해하셨나요?',
      options: [
        { id: 1, text: '완전히 이해했어요', votes: 0 },
        { id: 2, text: '대부분 이해했어요', votes: 0 },
        { id: 3, text: '조금 이해했어요', votes: 0 },
        { id: 4, text: '이해가 어려워요', votes: 0 },
      ],
      isActive: true,
    },
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createPoll = () => {
    if (newQuestion.trim() && newOptions.filter(opt => opt.trim()).length >= 2) {
      const newPoll: Poll = {
        id: polls.length + 1,
        question: newQuestion,
        options: newOptions
          .filter(opt => opt.trim())
          .map((opt, idx) => ({ id: idx + 1, text: opt, votes: 0 })),
        isActive: true,
      };

      setPolls([newPoll, ...polls]);
      setNewQuestion('');
      setNewOptions(['', '']);
      setShowCreateForm(false);
    }
  };

  const vote = (pollId: number, optionId: number) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          ),
        };
      }
      return poll;
    }));
  };

  const togglePollStatus = (pollId: number) => {
    setPolls(polls.map(poll =>
      poll.id === pollId ? { ...poll, isActive: !poll.isActive } : poll
    ));
  };

  const deletePoll = (pollId: number) => {
    setPolls(polls.filter(poll => poll.id !== pollId));
  };

  const resetVotes = (pollId: number) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(opt => ({ ...opt, votes: 0 })),
        };
      }
      return poll;
    }));
  };

  const addOption = () => {
    if (newOptions.length < 10) {
      setNewOptions([...newOptions, '']);
    }
  };

  const removeOption = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, idx) => idx !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">실시간 설문 📊</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {showCreateForm ? '취소' : '+ 새 설문 만들기'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-indigo-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">새 설문 만들기</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">질문</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="설문 질문을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">선택지</label>
              {newOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`선택지 ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {newOptions.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              {newOptions.length < 10 && (
                <button
                  onClick={addOption}
                  className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  + 선택지 추가
                </button>
              )}
            </div>

            <button
              onClick={createPoll}
              disabled={!newQuestion.trim() || newOptions.filter(opt => opt.trim()).length < 2}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              설문 생성
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

          return (
            <div
              key={poll.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                !poll.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex-1">{poll.question}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePollStatus(poll.id)}
                    className={`px-4 py-1 rounded text-sm font-medium ${
                      poll.isActive
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    } transition-colors`}
                  >
                    {poll.isActive ? '종료' : '재시작'}
                  </button>
                  <button
                    onClick={() => resetVotes(poll.id)}
                    className="px-4 py-1 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => deletePoll(poll.id)}
                    className="px-4 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">총 투표: {totalVotes}표</p>
              </div>

              <div className="space-y-3">
                {poll.options.map((option) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

                  return (
                    <div key={option.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-700 font-medium">{option.text}</span>
                        <span className="text-sm text-gray-600">
                          {option.votes}표 ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-8 rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && (
                              <span className="text-white text-sm font-bold">
                                {percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {poll.isActive && (
                          <button
                            onClick={() => vote(poll.id, option.id)}
                            className="absolute right-2 top-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                          >
                            투표
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!poll.isActive && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">⚠️ 이 설문은 종료되었습니다</p>
                </div>
              )}
            </div>
          );
        })}

        {polls.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">아직 생성된 설문이 없습니다</p>
            <p className="text-gray-400 mt-2">새 설문을 만들어보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
