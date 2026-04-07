'use client'

import { useState } from 'react'

export default function NyXiaChatWidget() {
  const [nxOpen, setNxOpen] = useState(false)
  const [nxFirst, setNxFirst] = useState(true)
  const [nxMsgs, setNxMsgs] = useState<{role: string; content: string}[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  function toggleChat() {
    const open = !nxOpen
    setNxOpen(open)
    if (open && nxFirst) {
      setNxFirst(false)
    }
  }

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    const now = new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    const newMsgs = [...nxMsgs, { role: 'user', content: text }]
    setNxMsgs(newMsgs)
    setIsTyping(true)
    try {
      const res = await fetch('https://nyxiapublicationweb.com/api/client-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs.slice(-20) }),
      })
      const data = await res.json()
      if (data.content) {
        setNxMsgs([...newMsgs, { role: 'assistant', content: data.content }])
      }
    } catch {
      setNxMsgs(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion. Réessaie.' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Styles */}
      <style>{`
        #nx-toggle{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;border:2px solid rgba(123,92,255,0.5);background:rgba(15,28,63,0.9);backdrop-filter:blur(12px);cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(123,92,255,0.3);transition:all .25s;padding:0}
        #nx-toggle:hover{transform:scale(1.1);box-shadow:0 0 50px rgba(123,92,255,0.5)}
        #nx-toggle img{width:42px;height:42px;border-radius:50%;object-fit:cover}
        #nx-chat{position:fixed;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 140px);background:rgba(15,28,63,0.97);border:1px solid rgba(123,92,255,0.3);border-radius:20px;z-index:9999;display:none;flex-direction:column;backdrop-filter:blur(20px);box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 40px rgba(123,92,255,0.15);overflow:hidden}
        #nx-chat.open{display:flex;animation:nxSlideIn .3s ease}
        @keyframes nxSlideIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        #nx-header{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(123,92,255,0.15);background:rgba(10,18,40,0.6)}
        #nx-header img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(123,92,255,0.4)}
        .nx-name{font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:#fff}
        .nx-status{font-size:11px;color:#00E676;display:flex;align-items:center;gap:5px}
        .nx-dot{width:5px;height:5px;border-radius:50%;background:#00E676;box-shadow:0 0 6px #00E676}
        #nx-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
        #nx-messages::-webkit-scrollbar{width:3px}
        #nx-messages::-webkit-scrollbar-thumb{background:rgba(123,92,255,0.2);border-radius:3px}
        .nx-msg{max-width:85%;animation:nxMsgIn .2s ease}
        @keyframes nxMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .nx-msg.bot{align-self:flex-start}
        .nx-msg.user{align-self:flex-end}
        .nx-bubble{padding:10px 14px;border-radius:16px;font-family:'Inter',sans-serif;font-size:13.5px;line-height:1.55}
        .nx-msg.bot .nx-bubble{background:rgba(26,37,84,0.7);color:#d6d9f0;border-top-left-radius:4px;border:1px solid rgba(123,92,255,0.1)}
        .nx-msg.user .nx-bubble{background:linear-gradient(135deg,#7B5CFF,#5A6CFF);color:#fff;border-top-right-radius:4px}
        .nx-msg .nx-time{font-size:10px;color:rgba(136,145,184,0.5);margin-top:3px}
        .nx-msg.bot .nx-time{text-align:left;padding-left:2px}
        .nx-msg.user .nx-time{text-align:right;padding-right:2px}
        .nx-welcome{display:flex;flex-direction:column;align-items:center;padding:20px 16px;text-align:center}
        .nx-welcome img{width:56px;height:56px;border-radius:50%;object-fit:cover;margin-bottom:12px;border:1.5px solid rgba(123,92,255,0.3);box-shadow:0 0 20px rgba(123,92,255,0.2)}
        .nx-welcome h4{font-family:'Inter',sans-serif;font-size:15px;font-weight:700;margin-bottom:4px;color:#fff}
        .nx-welcome p{font-size:12px;color:#8891b8;line-height:1.5;max-width:260px}
        .nx-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:12px;justify-content:center}
        .nx-chip{padding:5px 12px;border-radius:16px;background:rgba(123,92,255,0.1);border:1px solid rgba(123,92,255,0.2);color:#a78bfa;font-size:11px;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
        .nx-chip:hover{background:rgba(123,92,255,0.2);color:#fff;border-color:rgba(123,92,255,0.4)}
        #nx-typing{padding:4px 16px 8px;display:none;align-items:center;gap:6px;font-size:11px;color:#8891b8}
        .nx-dots{display:inline-flex;gap:3px}
        .nx-dots i{width:4px;height:4px;border-radius:50%;background:#8891b8;animation:nxPulse 1.4s infinite;font-style:normal}
        .nx-dots i:nth-child(2){animation-delay:.2s}
        .nx-dots i:nth-child(3){animation-delay:.4s}
        @keyframes nxPulse{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1)}}
        #nx-input-row{display:flex;gap:8px;padding:10px 14px 14px;border-top:1px solid rgba(123,92,255,0.1)}
        #nx-input{flex:1;padding:10px 14px;border-radius:12px;background:rgba(10,18,40,0.8);border:1px solid rgba(123,92,255,0.15);color:#fff;font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
        #nx-input:focus{border-color:rgba(123,92,255,0.4)}
        #nx-input::placeholder{color:rgba(136,145,184,0.4)}
        #nx-send{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#7B5CFF,#5A6CFF);border:none;color:#fff;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
        #nx-send:hover{transform:scale(1.05)}
        #nx-send:disabled{opacity:.3;cursor:not-allowed;transform:none}
        @media(max-width:500px){
          #nx-chat{width:calc(100vw - 16px);right:8px;bottom:88px;height:calc(100vh - 110px)}
        }
      `}</style>

      {/* Toggle button */}
      <button id="nx-toggle" onClick={toggleChat}>
        <img src="https://nyxiapublicationweb.com/NyXia.png" alt="NyXia" />
      </button>

      {/* Chat panel */}
      <div id="nx-chat" style={{ display: nxOpen ? 'flex' : 'none' }}>
        <div id="nx-header">
          <img src="https://nyxiapublicationweb.com/NyXia.png" alt="NyXia" />
          <div>
            <div className="nx-name">NyXia</div>
            <div className="nx-status"><span className="nx-dot" />En ligne</div>
          </div>
          <button
            onClick={toggleChat}
            style={{ background: 'none', border: 'none', color: '#8891b8', fontSize: '20px', cursor: 'pointer', marginLeft: 'auto', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <div id="nx-messages">
          {nxFirst && (
            <div className="nx-welcome">
              <img src="https://nyxiapublicationweb.com/NyXia.png" alt="NyXia" />
              <h4>Salut, moi c&apos;est NyXia</h4>
              <p>Je suis l&apos;agente IA de Publication-Web. Pose-moi une question ou dis-moi ce que tu cherches.</p>
              <div className="nx-chips">
                <div className="nx-chip" onClick={() => { setInput("Comment devenir ambassadeur ?"); }}>Ambassadeur gratuit</div>
                <div className="nx-chip" onClick={() => { setInput("Comment fonctionne l'affiliation ?"); }}>Comment ça marche</div>
                <div className="nx-chip" onClick={() => { setInput("J'ai une formation à vendre"); }}>J&apos;ai un produit</div>
              </div>
            </div>
          )}
          {nxMsgs.map((msg, i) => (
            <div key={i} className={`nx-msg ${msg.role}`}>
              <div className="nx-bubble" dangerouslySetInnerHTML={{ __html: msg.role === 'user' ? msg.content.replace(/</g, '&lt;') : msg.content.replace(/\n/g, '<br>') }} />
              <div className="nx-time">{new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
        </div>

        <div id="nx-typing" style={{ display: isTyping ? 'flex' : 'none' }}>
          <span className="nx-dots"><i /><i /><i /></span>
        </div>

        <div id="nx-input-row">
          <input
            id="nx-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            placeholder="Écris à NyXia..."
          />
          <button id="nx-send" onClick={send} disabled={isTyping}>➤</button>
        </div>
      </div>
    </>
  )
}
