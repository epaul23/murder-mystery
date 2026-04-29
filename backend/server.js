import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app = express();
app.use(cors({
  origin: '*'
}));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CASES = {
  1: {
    title: 'The Blackwood Manor Incident',
    setting: '1923, English countryside manor',
    victim: 'Lord Blackwood',
    method: 'Poisoned with arsenic in his evening tea',
    difficulty: 'easy',
    killer: 'Clara Finch',
    truth: `THE TRUTH (never reveal directly):
- Clara Finch is the killer. She poisoned the tea with arsenic.
- Motive: Lord Blackwood was blackmailing her over a stolen heirloom.
- She stole arsenic from Dr. Hale's medical bag that afternoon.
- Victoria and Reginald were having a secret affair — alibi each other.
- Dr. Hale noticed arsenic missing but assumed he miscounted.`,
    suspects: {
      'Clara Finch': { role: 'The Maid', bio: 'Has worked at the manor 10 years. Nervous, avoids eye contact.', personality: 'Overly eager to please. Mentions "the tea" unprompted when nervous. Gets flustered about her afternoon activities.' },
      'Victoria Blackwood': { role: 'The Widow', bio: 'Calm, almost too calm. Stands to inherit everything.', personality: 'Deflects with grief. Hints the maid had reasons to resent her husband. Hides her affair with Reginald.' },
      'Dr. Edmund Hale': { role: 'The Doctor', bio: 'Was called to the manor earlier that evening.', personality: 'Precise and clinical. Will admit his arsenic was unaccounted for if pressed. Rock solid alibi in the drawing room.' },
      'Reginald Cross': { role: 'The Business Partner', bio: 'Had a bitter dispute with Lord Blackwood over money.', personality: 'Loud and defensive. Accidentally says "Victoria and I" then backtracks. Dispute was resolved last week.' },
    },
  },
  2: {
    title: 'Death on the Orient Express Lounge',
    setting: '1934, luxury train crossing Europe',
    victim: 'Ambassador Henri Duval',
    method: 'Stabbed with a letter opener, staged as robbery',
    difficulty: 'medium',
    killer: 'Sophia Vance',
    truth: `THE TRUTH (never reveal directly):
- Sophia Vance stabbed Duval with his own letter opener.
- Motive: Duval stole her research for 5 years and laughed when confronted.
- She staged it as robbery, planted wallet in luggage car.
- Porter heard arguing at 11:15pm — Sophia claims she left at 11:00pm.
- Madame Leclair has airtight alibi — dining car, 6 witnesses.`,
    suspects: {
      'Sophia Vance': { role: 'The Secretary', bio: "Duval's secretary for 5 years. Brilliant, quietly intense.", personality: 'Calm but slips when her research is mentioned. Claims she left at 11pm. Knows too many crime scene details.' },
      'Colonel Marsh': { role: 'The Military Man', bio: 'Retired colonel, old friend of the victim.', personality: 'Stiff and evasive. Protective of Sophia. Knows the wallet location before it was announced.' },
      'Madame Leclair': { role: 'The Socialite', bio: 'Glamorous French socialite.', personality: 'Theatrical. Rock solid alibi. But overheard arguing near cabin 14 at 11:10 and saw someone in a green shawl.' },
      'The Porter': { role: 'The Porter', bio: 'Has worked this route 12 years. Quiet and observant.', personality: 'Nervous about getting involved. Heard arguing at 11:15. Saw a woman leave cabin 14 at 11:22 matching Sophia.' },
    },
  },
  3: {
    title: 'The Silicon Valley Shutdown',
    setting: '2024, San Francisco tech startup',
    victim: 'CEO Marcus Webb',
    method: 'Sedatives in his protein shake, staged as accident',
    difficulty: 'hard',
    killer: 'Jordan Kim',
    truth: `THE TRUTH (never reveal directly):
- Jordan Kim added sedatives to Marcus's protein shake at 8:47am.
- Motive: Marcus was about to fire Jordan and steal $200M of shared IP.
- Jordan's standup meeting ended at 8:42am not 9:30am as claimed — 12 min gap.
- Derek saw Jordan in the kitchen at 8:47 but is scared to say so.
- Priya is deliberately acting suspicious as a distraction — innocent.`,
    suspects: {
      'Jordan Kim': { role: 'Co-founder & CTO', bio: 'Co-founded the company with Marcus. Recently sidelined.', personality: 'Confident, uses technical language to deflect. Claims standup ran 8:30-9:30 but it ended at 8:42. Has medical knowledge.' },
      'Priya Sharma': { role: 'Head of Product', bio: 'Had a public argument with Marcus last week.', personality: 'Openly hostile — almost too much. Airtight alibi on recorded investor call 8-10:30am. Points at Jordan unprompted.' },
      'Derek Osei': { role: 'Office Manager', bio: 'Knows everyone\'s schedules. Mild-mannered.', personality: 'Nervous when Jordan is mentioned. Saw Jordan in kitchen at 8:47 but scared. Will reveal if asked gently.' },
      'Natalie Cruz': { role: 'Head of Legal', bio: 'Was drawing up termination papers that morning.', personality: 'Professional. Confirms she was preparing Jordan\'s termination letter. Marcus told her "Jordan\'s been stealing from me".' },
    },
  },
};

const DIFFICULTY_PROMPTS = {
  easy: 'Drop clues generously. One clear clue every 2 questions.',
  medium: 'More evasive. Clues require follow-up. Some red herrings.',
  hard: 'Skilled liars. Subtle clues. Lots of misdirection.',
};

app.get('/api/cases', (req, res) => {
  const cases = Object.entries(CASES).map(([id, c]) => ({
    id: Number(id), title: c.title, setting: c.setting, victim: c.victim,
    method: c.method, difficulty: c.difficulty, suspectNames: Object.keys(c.suspects),
  }));
  res.json(cases);
});

app.post('/api/interrogate', async (req, res) => {
  const { caseId, suspectName, question, history } = req.body;
  const caseData = CASES[caseId];
  if (!caseData) return res.status(400).json({ error: 'Invalid case' });
  const suspect = caseData.suspects[suspectName];
  if (!suspect) return res.status(400).json({ error: 'Invalid suspect' });

  const systemPrompt = `You are running a murder mystery game.
CASE: ${caseData.title} | SETTING: ${caseData.setting} | VICTIM: ${caseData.victim} — ${caseData.method}
${caseData.truth}
DIFFICULTY: ${DIFFICULTY_PROMPTS[caseData.difficulty]}
YOU ARE PLAYING: ${suspectName} (${suspect.role}) — ${suspect.bio}
Personality: ${suspect.personality}
RULES: Stay in character. Never confess directly. 2-4 sentences per response. Be dramatic and evasive.`;

  const messages = [...(history || []), { role: 'user', content: question }];
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 200, temperature: 0.85,
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Groq API error' });
  }
});

app.post('/api/accuse', async (req, res) => {
  const { caseId, accusedName, reasoning } = req.body;
  const caseData = CASES[caseId];
  if (!caseData) return res.status(400).json({ error: 'Invalid case' });
  const correct = accusedName === caseData.killer;
  const prompt = correct
    ? `The player correctly identified ${caseData.killer} as the killer in "${caseData.title}". Reasoning: "${reasoning}". Give a dramatic 3-4 sentence reveal confirming they got it right and explaining the full truth. Be theatrical.`
    : `The player wrongly accused ${accusedName} in "${caseData.title}". Real killer is ${caseData.killer}. Reasoning: "${reasoning}". Mock their wrong accusation then dramatically reveal the real killer and a clue they missed.`;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250, temperature: 0.9,
    });
    res.json({ correct, killer: caseData.killer, reveal: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Groq API error' });
  }
});

const PORT = process.env.PORT || 8080;

// Save score to leaderboard
app.post('/api/leaderboard', async (req, res) => {
  const { player_name, case_id, case_title, score, questions_used, solved } = req.body;
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ player_name, case_id, case_title, score, questions_used, solved }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Get leaderboard for a case
app.get('/api/leaderboard/:caseId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('case_id', req.params.caseId)
      .eq('solved', true)
      .order('score', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));