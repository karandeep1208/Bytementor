import React, { useState } from 'react';
import axios from 'axios';
import { FiSend, FiBookOpen, FiPlay, FiHelpCircle, FiFileText, FiLoader, FiDownload } from 'react-icons/fi';
import './App.css';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content:
        "Hi! I'm ByteMentor, your AI-powered learning assistant. Enter any topic or keyword, and I'll create a personalized mini-course with videos, quizzes, and study materials for you!"
    }
  ]);

  // Helper: download a base64 PDF returned by the backend
  const downloadBase64Pdf = (base64Data, filename = 'cheatsheet.pdf') => {
    if (!base64Data) return;
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    }
  };

  const handleQuizAnswer = (questionIndex, selectedOption, correctAnswer, explanation, topic) => {
    const isCorrect = selectedOption === correctAnswer;
    const topicKey = topic.toLowerCase().replace(/\s+/g, '_');
    const answerKey = `${topicKey}_question_${questionIndex}`;

    setQuizAnswers(prev => ({
      ...prev,
      [answerKey]: {
        selected: selectedOption,
        isCorrect: isCorrect,
        explanation: explanation,
        correctAnswer: correctAnswer,
        topic: topic
      }
    }));
  };

  const generateCourse = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: keyword
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-course`, {
        keyword: keyword.trim()
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `I've created a mini-course about "${keyword}". Here's what I found for you:`,
        courseData: response.data
      };
      setMessages(prev => [...prev, botMessage]);
      setKeyword('');
    } catch (err) {
      setError('Failed to generate course. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateCourse();
    }
  };

  const CheatSheetSection = ({ summary }) => {
    const downloadPdf = () => {
      if (summary?.cheatSheetPdf?.data) {
        const linkSource = `data:application/pdf;base64,${summary.cheatSheetPdf.data}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = summary.cheatSheetPdf.filename;
        downloadLink.click();
      }
    };

    if (!summary?.cheatSheet) return null;

    return (
      <div className="study-guide-container">
        <div className="study-guide-header">
          <button 
            className="download-btn"
            onClick={downloadPdf}
            disabled={!summary?.cheatSheetPdf?.data}
          >
            <FiDownload /> Download PDF
          </button>
        </div>

        <div className="study-guide-content">
          {summary.cheatSheet.split('\n').map((line, index) => {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
              return <div key={index} className="content-spacer" />;
            }

            // Section headers (all caps)
            if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3) {
              return <h2 key={index} className="section-title">{trimmedLine}</h2>;
            }

            // Code blocks
            if (trimmedLine.includes('function') || trimmedLine.includes('class') || trimmedLine.startsWith('[Code')) {
              return (
                <pre key={index} className="code-block">
                  <code>{trimmedLine}</code>
                </pre>
              );
            }

            // Numbered points (e.g., "1. ", "2. ")
            if (/^\d+\./.test(trimmedLine)) {
              return <p key={index} className="numbered-point">{trimmedLine}</p>;
            }

            // Regular text
            return <p key={index} className="content-text">{trimmedLine}</p>;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-content">
          <div className="logo">
            <FiBookOpen size={32} />
            <h1>ByteMentor</h1>
          </div>
          <p>AI-powered mini-course generator</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.content}</div>

                {/* Render course content if available */}
                {message.courseData && (
                  <div className="course-content">
                    {/* Videos Section */}
                    {message.courseData.videos && message.courseData.videos.length > 0 && (
                      <div className="section">
                        <h3>
                          <FiPlay size={20} /> Learning Videos
                        </h3>
                        <div className="video-grid">
                          {message.courseData.videos.map((video, index) => (
                            <div key={index} className="video-card">
                              <img src={video.thumbnail} alt={video.title} />
                              <div className="video-info">
                                <h4>{video.title}</h4>
                                <p className="channel">{video.channel}</p>
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="watch-btn"
                                >
                                  Watch Video
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quiz Section */}
                    {message.courseData.quiz && message.courseData.quiz.questions && message.courseData.quiz.questions.length > 0 && (
                      <div className="section">
                        <h3>
                          <FiHelpCircle size={20} /> Quiz
                        </h3>
                        <div className="quiz-container">
                          {message.courseData.quiz.questions.map((question, qIndex) => {
                            const topicKey = message.courseData.keyword.toLowerCase().replace(/\s+/g, '_');
                            const answerKey = `${topicKey}_question_${qIndex}`;
                            const userAnswer = quizAnswers[answerKey];

                            return (
                              <div key={qIndex} className="question-card">
                                <h4>{question.question}</h4>
                                <div className="options">
                                  {question.options.map((option, oIndex) => {
                                    let optionClass = 'option';
                                    if (userAnswer) {
                                      if (oIndex === userAnswer.correctAnswer) optionClass += ' correct';
                                      else if (oIndex === userAnswer.selected && !userAnswer.isCorrect) optionClass += ' incorrect';
                                    }

                                    return (
                                      <label
                                        key={oIndex}
                                        className={optionClass}
                                        onClick={() => {
                                          if (!userAnswer) {
                                            handleQuizAnswer(
                                              qIndex,
                                              oIndex,
                                              question.correctAnswer,
                                              question.explanation,
                                              message.courseData.keyword
                                            );
                                          }
                                        }}
                                      >
                                        <input
                                          type="radio"
                                          name={`question-${message.courseData.keyword}-${qIndex}`}
                                          checked={userAnswer && userAnswer.selected === oIndex}
                                          readOnly
                                        />
                                        <span>{option}</span>
                                        {userAnswer && oIndex === userAnswer.correctAnswer && (
                                          <span className="correct-indicator">✓</span>
                                        )}
                                        {userAnswer && oIndex === userAnswer.selected && !userAnswer.isCorrect && (
                                          <span className="incorrect-indicator">✗</span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                                {userAnswer && (
                                  <div className={`explanation ${userAnswer.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="feedback">
                                      <strong>{userAnswer.isCorrect ? 'Correct!' : 'Incorrect!'}</strong>
                                    </div>
                                    <div className="explanation-text">
                                      <strong>Explanation:</strong> {userAnswer.explanation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Formatted Cheat Sheet Section */}
                    {message.courseData.summary && (
                      <div className="section">
                        <h3>
                          <FiFileText size={20} /> {message.courseData.summary.cheatSheet?.title || 'Study Summary'}
                        </h3>
                        <div className="summary-container">
                          {message.courseData.summary.cheatSheet && (
                            <div className="cheat-sheet">
                              <div className="cheat-sheet-content">
                                <ul><CheatSheetSection summary={message.courseData.summary} /></ul>

                                {/* Download PDF: use server-provided PDF if available, otherwise request PDF generation */}
                                <div style={{ marginTop: '1rem' }}>
                                  <button
                                    className="download-btn"
                                    onClick={async () => {
                                      const summary = message.courseData.summary;
                                      const course = message.courseData;

                                      if (summary.cheatSheetPdf && summary.cheatSheetPdf.data) {
                                        downloadBase64Pdf(summary.cheatSheetPdf.data, summary.cheatSheetPdf.filename || 'cheatsheet.pdf');
                                        return;
                                      }

                                      try {
                                        const payload = {
                                          text: summary.cheatSheet,
                                          filename: `${(course.keyword || 'cheatsheet').replace(/\s+/g, '_')}_cheatsheet.pdf`
                                        };
                                        const resp = await axios.post(`${API_BASE_URL}/api/generate-pdf`, payload);
                                        if (resp?.data?.data) {
                                          downloadBase64Pdf(resp.data.data, resp.data.filename || payload.filename);
                                        } else {
                                          console.error('PDF generation failed on server', resp?.data);
                                          alert('PDF generation failed. Check console for details.');
                                        }
                                      } catch (err) {
                                        console.error('Error requesting PDF generation:', err);
                                        alert('Failed to generate PDF. See console for details.');
                                      }
                                    }}
                                  >
                                    Download PDF
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Fallback for old format */}
                          {message.courseData.summary.overview && (
                            <div className="overview">
                              <h4>Overview</h4>
                              <p>{message.courseData.summary.overview}</p>
                            </div>
                          )}

                          {message.courseData.summary.keyPoints && message.courseData.summary.keyPoints.length > 0 && (
                            <div className="key-points">
                              <h4>Key Points</h4>
                              <ul>
                                {message.courseData.summary.keyPoints.map((point, index) => (
                                  <li key={index}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {message.courseData.summary.tips && message.courseData.summary.tips.length > 0 && (
                            <div className="tips">
                              <h4>Learning Tips</h4>
                              <ul>
                                {message.courseData.summary.tips.map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message bot">
              <div className="message-content">
                <div className="loading">
                  <FiLoader size={20} className="spinning" /> Generating your mini-course...
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a topic or keyword (e.g., 'Java', 'React Hooks', 'Python Basics')"
              disabled={loading}
            />
            <button onClick={generateCourse} disabled={loading || !keyword.trim()} className="send-button">
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;