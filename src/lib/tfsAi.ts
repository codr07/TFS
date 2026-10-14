// TFS AI Core Assistant for Music Theory, Chord Transposition, Songwriting & Academy Guidance

export interface AiMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: 'theory' | 'chords' | 'practice' | 'general';
}

const KNOWLEDGE_BASE: Record<string, string> = {
  guitar_tuning: "Standard guitar tuning is E - A - D - G - B - E (from 6th string lowest pitch to 1st string highest pitch). Dotara ukulele tuning is typically G - C - E - A or custom open tunings.",
  scales: "The Major scale follows the whole/half step pattern: W - W - H - W - W - W - H. For C Major: C - D - E - F - G - A - B - C. The natural minor follows: W - H - W - W - H - W - W (e.g. A minor: A - B - C - D - E - F - G - A).",
  chords: "Basic open chords for guitar:\n• C Major: x-3-2-0-1-0\n• G Major: 3-2-0-0-0-3 (or 3-2-0-0-3-3)\n• D Major: x-x-0-2-3-2\n• E Minor: 0-2-2-0-0-0\n• A Minor: x-0-2-2-1-0\n• F Major (Barre): 1-3-3-2-1-1",
  barre_tips: "To master barre chords: 1. Place your index finger slightly turned on its bony side, not flat. 2. Position it close to the fret wire. 3. Use your arm weight rather than thumb squeeze to apply pressure. 4. Practice the shape on fret 5 (A major shape) where string tension is lower before trying F on fret 1.",
  circle_of_fifths: "The Circle of Fifths arranges the 12 chromatic pitches by intervals of perfect fifths. Clockwise: C (0 sharps) -> G (1#) -> D (2#) -> A (3#) -> E (4#) -> B (5#) -> F# (6#). Counter-clockwise by fourths adds flats: F (1b) -> Bb (2b) -> Eb (3b) -> Ab (4b) -> Db (5b) -> Gb (6b).",
  transposition: "To transpose chords between keys:\n• Count the interval difference between original root and target root.\n• Shift every chord in the progression by that exact number of semitones.\n• Example: C - Am - F - G transposed up 2 semitones (1 whole step) becomes D - Bm - G - A.",
  fingerstyle: "P-I-M-A technique in fingerstyle:\n• P (Pulgar) = Thumb, plays bass strings (E, A, D)\n• I (Indice) = Index, plays 3rd string (G)\n• M (Medio) = Middle, plays 2nd string (B)\n• A (Anular) = Ring, plays 1st string (high E)\nKeep your wrist arched and relaxed without anchoring your pinky too stiffly on the top.",
  metronome: "Practice recommendation: Start difficult passages at 50% target tempo (e.g. 60 BPM). Play 5 consecutive clean reps before increasing tempo by 4 BPM. Consistency builds muscle memory faster than erratic fast playing.",
  fees: "TFS Fee Plans:\n• Online 1-to-1: ₹900/month\n• Home Tuition (Designated location): ₹1,300/month\n• Home Visit (Instructor visits your address): ₹1,500/month\n• Ukulele (Dotara) Home Tuition: ₹1,500/month\n• Add-ons: Songwriting (₹500/mo), Music Composing (₹1,500/mo)",
  curriculum: "TFS offers tracks in:\n1. Acoustic Guitar: Beginner chords, Fingerstyle independence, Intermediate pathways, and Advanced harmonic control.\n2. Standard Ukulele: Strumming patterns, chord shapes, and melodic tabs.\n3. Ukulele (Dotara): Traditional folk strumming, regional tabs, and picking techniques.",
};

export async function askTfsAi(prompt: string, context?: { curriculum?: string; plan?: string; studentName?: string }): Promise<string> {
  const cleanPrompt = prompt.trim().toLowerCase();

  // Check if user has configured an external Gemini API key
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || (import.meta.env.GEMINI_API_KEY as string | undefined);
  if (envKey && envKey.trim()) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(envKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are the AI Music Master & Theory Tutor at The Fretboard Society (TFS), a prestigious guitar and ukulele mastery academy located in Kolkata, India.
Student Context: ${context ? JSON.stringify(context) : 'None'}.
Academy Curriculum: Acoustic Guitar, Standard Ukulele, Ukulele (Dotara), Songwriting, and Music Composing.
Provide helpful, inspiring, technically accurate, concise music theory, guitar tab, or academy guidance.

Student question: ${prompt}`
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) return generated;
      }
    } catch {
      // Fallback gracefully to offline intelligence engine
    }
  }

  // Built-in intelligent responsive music mentor engine
  if (cleanPrompt.includes('hello') || cleanPrompt.includes('hi') || cleanPrompt.includes('hey')) {
    const greetingName = context?.studentName ? ` ${context.studentName}` : '';
    return `Greetings${greetingName}! 🎸 I am your TFS AI Music Tutor & Academy Assistant. I can assist you with chord shapes, fretboard theory, scale diagrams, transposition, fingerpicking patterns, or questions about your ${context?.curriculum || 'Acoustic Guitar'} curriculum. How can I help your music journey today?`;
  }

  if (cleanPrompt.includes('chord') || cleanPrompt.includes('shape') || cleanPrompt.includes('tab')) {
    if (cleanPrompt.includes('barre') || cleanPrompt.includes('f chord') || cleanPrompt.includes('b minor')) {
      return `💡 **Barre Chord Mastery Tips:**\n${KNOWLEDGE_BASE.barre_tips}\n\n**Common shapes:**\n• F Major: 1-3-3-2-1-1 (Root on 6th string)\n• B Minor: x-2-4-4-3-2 (Root on 5th string)\n• Bb Major: x-1-3-3-3-1`;
    }
    return `🎵 **Essential Open Chords for ${context?.curriculum || 'Guitar'}:**\n${KNOWLEDGE_BASE.chords}\n\n*Tip: Focus on clean finger placement right behind each fret wire to avoid fret buzz!*`;
  }

  if (cleanPrompt.includes('scale') || cleanPrompt.includes('mode') || cleanPrompt.includes('pentatonic')) {
    if (cleanPrompt.includes('pentatonic')) {
      return `🎸 **Minor Pentatonic Scale Formula (1 - b3 - 4 - 5 - b7):**\n• For A Minor Pentatonic: A - C - D - E - G\n• Position 1 Box (Fret 5 to 8):\n  String 6: 5 - 8\n  String 5: 5 - 7\n  String 4: 5 - 7\n  String 3: 5 - 7\n  String 2: 5 - 8\n  String 1: 5 - 8\nAdd the flat 5 (Eb on fret 6 of string 5) to turn it into the expressive Blues Scale!`;
    }
    return `🎼 **Musical Scale Foundation:**\n${KNOWLEDGE_BASE.scales}\n\nRemember: All natural major and minor scales derive from the same circle of 12 tones.`;
  }

  if (cleanPrompt.includes('transpose') || cleanPrompt.includes('capo') || cleanPrompt.includes('key change')) {
    return `🔄 **Transposition Guide:**\n${KNOWLEDGE_BASE.transposition}\n\n**Capo Trick:** To play in a singer's higher key without learning new shapes, move your capo up by 1 fret for every semitone (e.g. Capo 2 turns G shapes into the key of A).`;
  }

  if (cleanPrompt.includes('fingerstyle') || cleanPrompt.includes('picking') || cleanPrompt.includes('plucking')) {
    return `🎶 **Fingerstyle PIMA Technique:**\n${KNOWLEDGE_BASE.fingerstyle}\n\nTry this Travis picking pattern over C Major: Thumb on 5th -> Middle on 2nd -> Thumb on 4th -> Index on 3rd string.`;
  }

  if (cleanPrompt.includes('tune') || cleanPrompt.includes('tuning') || cleanPrompt.includes('strings')) {
    return `🎯 **Instrument Tuning Reference:**\n${KNOWLEDGE_BASE.guitar_tuning}\n\nUse an electronic chromatic tuner or 440 Hz reference pitch to calibrate your strings.`;
  }

  if (cleanPrompt.includes('circle of fifth') || cleanPrompt.includes('fifth') || cleanPrompt.includes('key')) {
    return `⭕ **Circle of Fifths Reference:**\n${KNOWLEDGE_BASE.circle_of_fifths}`;
  }

  if (cleanPrompt.includes('fee') || cleanPrompt.includes('payment') || cleanPrompt.includes('price') || cleanPrompt.includes('cost')) {
    return `💳 **TFS Academy Tuition Breakdown:**\n${KNOWLEDGE_BASE.fees}\n\nYou can pay your tuition directly via UPI or review receipts in the **Tuition & Fees** tab.`;
  }

  if (cleanPrompt.includes('curriculum') || cleanPrompt.includes('class') || cleanPrompt.includes('track')) {
    return `📚 **Academy Curriculum Tracks:**\n${KNOWLEDGE_BASE.curriculum}\n\nYour current track is configured as **${context?.curriculum || 'Guitar'}**. You can track your completed module milestones in your dashboard.`;
  }

  if (cleanPrompt.includes('practice') || cleanPrompt.includes('metronome') || cleanPrompt.includes('speed') || cleanPrompt.includes('bpm')) {
    return `⏱️ **Productive Practice Routine (45 mins daily):**\n1. **Warmup (10m):** 1-2-3-4 chromatic coordination with metronome at 60-80 BPM.\n2. **Technique & Repertoire (20m):** Isolate transitions or fingerstyle passages in 4-bar chunks.\n3. **Theory & Fretboard (10m):** Locate chord triads or scale notes across strings.\n4. **Musical Expression (5m):** Jam freely along with backing tracks.\n\n${KNOWLEDGE_BASE.metronome}`;
  }

  // Default intelligent assistant response
  return `🎶 Here are some guidance notes from TFS Academy on **"${prompt}"**:\n\n• For playing techniques, focus on hand relaxation, light fret pressure, and steady meter.\n• If you are composing or arranging chords, experiment with diatonic progressions like I - vi - IV - V (e.g. C - Am - F - G) or ii - V - I.\n• For personalized 1-to-1 questions or special requests, you can submit an inquiry directly through the **Helpdesk & Requests** tab to your TFS instructor.`;
}
