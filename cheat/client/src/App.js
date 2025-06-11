import React, { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [particles, setParticles] = useState([]);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showApiLimitPopup, setShowApiLimitPopup] = useState(false);

  // Generate floating particles for background effect
  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 1.5 + 0.3,
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: (particle.y + particle.speed) % 100,
      })));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // First try with back camera
        let stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
          console.log("Camera started successfully");
        }
      } catch (err) {
        console.error("Back camera failed, trying front camera:", err);
        
        try {
          // Fallback to front camera
          let stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setIsStreaming(true);
            console.log("Front camera started successfully");
          }
        } catch (err2) {
          console.error("Front camera also failed, trying basic video:", err2);
          
          try {
            // Final fallback - basic video request
            let stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
              setIsStreaming(true);
              console.log("Basic camera started successfully");
            }
          } catch (err3) {
            console.error("All camera attempts failed:", err3);
            setResponse("❌ Camera access failed. Please:\n1. Allow camera permissions\n2. Use HTTPS (not HTTP)\n3. Try refreshing the page\n4. Check if another app is using the camera");
          }
        }
      }
    };

    startCamera();
  }, []);

  const captureAndSend = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    setOcrProgress(0);
    setResponse("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // OCR with Tesseract and progress tracking
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      console.log("Detected text:", text);

      if (text.trim()) {
        setOcrProgress(100);
        // Send to backend
        try {
          const res = await fetch("http://localhost:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

          const data = await res.json();
          // Check for API limit in response
          if (data.error && (data.error.includes('limit') || data.error.includes('quota'))) {
            setShowApiLimitPopup(true);
          } else if (data.reply) {
            setResponse(data.reply);
          } else {
            setResponse("No reply received from AI");
          }
        } catch (err) {
          console.error("Fetch error:", err);
          // Check if it's an API limit error
          if (err.message.includes('limit') || err.status === 429) {
            setShowApiLimitPopup(true);
          } else {
            setResponse("⚠️ Unable to connect to AI service. Please check if the backend is running.");
          }
        }
      } else {
        setResponse("🔍 No text detected in the image. Please try again with clearer text.");
      }
    } catch (err) {
      console.error("OCR error:", err);
      setResponse("❌ OCR processing failed. Please try again.");
    }

    setIsProcessing(false);
    setOcrProgress(0);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const particleStyle = (particle) => ({
    position: 'absolute',
    width: '4px',
    height: '4px',
    backgroundColor: '#60a5fa',
    borderRadius: '50%',
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    opacity: particle.opacity,
    transform: `scale(${particle.size})`,
    animation: `pulse ${2 + Math.random() * 2}s infinite ease-in-out`,
    pointerEvents: 'none'
  });

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 50%, rgba(16,52,96,0.2) 100%)',
    pointerEvents: 'none'
  };

  const mainContentStyle = {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '16px',
    gap: '24px'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '24px'
  };

  const iconContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px'
  };

  const iconStyle = (delay = 0) => ({
    padding: '12px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #8b5cf6, #3b82f6)',
    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.25)',
    animation: `pulse 2s infinite ease-in-out ${delay}ms`
  });

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #60a5fa, #a78bfa, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 8px 0'
  };

  const subtitleStyle = {
    color: '#d1d5db',
    fontSize: '1rem',
    fontWeight: '300',
    letterSpacing: '0.05em'
  };

  const cameraContainerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '400px'
  };

  const cameraBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
    borderRadius: '24px',
    filter: 'blur(20px)',
    transform: 'scale(1.05)'
  };

  const cameraWrapperStyle = {
    position: 'relative',
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '16px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
  };

  const videoContainerStyle = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
  };

  const videoStyle = {
    width: '100%',
    height: '320px',
    objectFit: 'cover',
    backgroundColor: '#374151',
    maxWidth: '400px',
    display: 'block'
  };

  const scanningOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none'
  };

  const processingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    borderRadius: '16px'
  };

  const processingContentStyle = {
    textAlign: 'center',
    color: 'white'
  };

  const progressBarStyle = {
    width: '128px',
    height: '4px',
    backgroundColor: '#374151',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '12px'
  };

  const progressFillStyle = {
    height: '100%',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    transition: 'width 0.3s ease',
    width: `${ocrProgress}%`
  };

  const buttonStyle = {
    position: 'relative',
    padding: '16px 32px',
    background: isProcessing || !isStreaming 
      ? 'linear-gradient(45deg, #6b7280, #4b5563)' 
      : 'linear-gradient(45deg, #8b5cf6, #3b82f6)',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '600',
    color: 'white',
    fontSize: '16px',
    cursor: isProcessing || !isStreaming ? 'not-allowed' : 'pointer',
    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.25)',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const responseContainerStyle = {
    width: '100%',
    maxWidth: '500px'
  };

  const responseWrapperStyle = {
    position: 'relative',
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
  };

  const responseBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
    borderRadius: '24px'
  };

  const responseHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  };

  const responseIconStyle = {
    padding: '8px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #10b981, #059669)',
    color: 'white',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const responseContentStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const statusStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
    color: '#9ca3af'
  };

  const statusItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const statusDotStyle = (active) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: active ? '#10b981' : '#ef4444',
    animation: active ? 'pulse 2s infinite' : 'none'
  });

  return (
    <div style={containerStyle}>
      {/* Animated background particles */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.map(particle => (
          <div key={particle.id} style={particleStyle(particle)} />
        ))}
      </div>

      {/* Gradient overlay */}
      <div style={overlayStyle} />
      
      <div style={mainContentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            <div style={iconStyle(0)}>🧠</div>
            <div style={iconStyle(300)}>👁️</div>
            <div style={iconStyle(700)}>✨</div>
          </div>
          
          <h1 style={titleStyle}>📷 AI OCR Vision</h1>
          <p style={subtitleStyle}>Instant Text Recognition • AI-Powered Answers</p>
        </div>

        {/* Camera viewport */}
        <div style={cameraContainerStyle}>
          <div style={cameraBackgroundStyle} />
          <div style={cameraWrapperStyle}>
            {!isStreaming && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
                textAlign: 'center',
                color: 'white',
                background: 'rgba(0,0,0,0.7)',
                padding: '20px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>Starting Camera...</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Please allow camera permissions
                </div>
              </div>
            )}
            <div style={videoContainerStyle}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                muted
                controls={false}
                style={videoStyle}
                onLoadedMetadata={() => {
                  console.log("Video metadata loaded");
                  if (videoRef.current) {
                    videoRef.current.play().catch(e => console.error("Video play failed:", e));
                  }
                }}
                onError={(e) => {
                  console.error("Video error:", e);
                  setResponse("Video stream error. Please refresh and try again.");
                }}
              />
              
              {/* Scanning overlay effect */}
              {isStreaming && !isProcessing && (
                <div style={scanningOverlayStyle}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
                    animation: 'pulse 2s infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)',
                    animation: 'pulse 2s infinite 0.5s'
                  }} />
                </div>
              )}

              {/* Processing overlay */}
              {isProcessing && (
                <div style={processingOverlayStyle}>
                  <div style={processingContentStyle}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {ocrProgress > 0 ? `Processing... ${ocrProgress}%` : 'Analyzing Image...'}
                    </div>
                    {ocrProgress > 0 && (
                      <div style={progressBarStyle}>
                        <div style={progressFillStyle} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <canvas 
          ref={canvasRef} 
          width="300" 
          height="200" 
          style={{ display: 'none' }}
        />

        {/* Capture button */}
        <button 
          onClick={captureAndSend}
          disabled={isProcessing || !isStreaming}
          style={buttonStyle}
          onMouseOver={(e) => {
            if (!isProcessing && isStreaming) {
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isProcessing ? (
            <>
              <span>⏳</span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>📷</span>
              <span>Capture & Analyze</span>
              <span>⚡</span>
            </>
          )}
        </button>

        {/* Response area */}
        {(response || isProcessing) && (
          <div style={responseContainerStyle}>
            <div style={responseWrapperStyle}>
              <div style={responseBackgroundStyle} />
              <div style={{ position: 'relative' }}>
                <div style={responseHeaderStyle}>
                  <div style={responseIconStyle}>💬</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>
                    AI Response
                  </h3>
                </div>
                
                <div style={responseContentStyle}>
                  {isProcessing && !response ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d1d5db' }}>
                      <span>🤔</span>
                      <span style={{ fontSize: '14px' }}>AI is thinking...</span>
                    </div>
                  ) : (
                    <p style={{ 
                      color: 'white', 
                      lineHeight: '1.6', 
                      fontSize: '14px', 
                      margin: 0 
                    }}>
                      {response}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div style={statusStyle}>
          <div style={statusItemStyle}>
            <div style={statusDotStyle(isStreaming)} />
            <span>{isStreaming ? 'Camera Active' : 'Camera Inactive'}</span>
          </div>
          <div style={statusItemStyle}>
            <div style={statusDotStyle(isProcessing)} />
            <span>{isProcessing ? 'Processing' : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* API Limit Popup */}
      {showApiLimitPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(59, 130, 246, 0.9))',
            borderRadius: '24px',
            padding: '0',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            animation: 'slideUp 0.4s ease-out',
            overflow: 'hidden'
          }}>
            {/* Animated background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
              `,
              animation: 'float 6s ease-in-out infinite'
            }} />
            
            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '32px' }}>
              {/* Header with animated icon */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #ef4444, #f97316)',
                  marginBottom: '16px',
                  animation: 'bounce 2s ease-in-out infinite',
                  boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)'
                }}>
                  <span style={{ fontSize: '36px' }}>⚠️</span>
                </div>
                <h2 style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                }}>
                  API Limit Reached
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  margin: 0,
                  opacity: 0.8
                }}>
                  Daily quota exceeded
                </p>
              </div>

              {/* Message */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  margin: '0 0 12px 0',
                  textAlign: 'center'
                }}>
                  <strong>API KEY WAS EXTENDED LIMIT</strong>
                </p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  Please try again later or visit my GitHub and read documentation for more information.
                </p>
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexDirection: window.innerWidth < 400 ? 'column' : 'row'
              }}>
                <button
                  onClick={() => window.open('https://github.com', '_blank')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: 'linear-gradient(45deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <span>📚</span>
                  <span>View Documentation</span>
                </button>
                
                <button
                  onClick={() => setShowApiLimitPopup(false)}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Close
                </button>
              </div>

              {/* Decorative elements */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                animation: 'pulse 3s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                animation: 'pulse 3s ease-in-out infinite 1s'
              }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(-5px) rotate(-1deg); }
        }
        
        @media (max-width: 768px) {
          h1 { font-size: 2rem !important; }
          p { font-size: 0.875rem !important; }
        }
      `}</style>
      {/* Footer */}
<div style={{
  marginTop: '40px',
  padding: '20px',
  textAlign: 'center',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px 16px 0 0'
}}>
  <p style={{
    color: '#9ca3af',
    fontSize: '14px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }}>
    <span>Developed with</span>
    <span style={{
      color: '#ef4444',
      fontSize: '16px',
      animation: 'pulse 2s infinite'
    }}>❤️</span>
    <span>by</span>
    <span style={{
      color: '#60a5fa',
      fontWeight: '600',
      background: 'linear-gradient(45deg, #60a5fa, #a78bfa)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }}>Vandan Dalvi</span>
  </p>
</div>
    </div>
  );
}

export default App;